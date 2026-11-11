import express from "express";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { requireEventOwner } from "../middleware/eventOwner.js";
import {
  authenticateToken,
  requireAdmin,
  requireStudent,
} from "../middleware/auth.js";
import { Parser as Json2csvParser } from "json2csv";
import nodemailer from "nodemailer";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const router = express.Router();

// Utility function to send email
async function sendEmail({ to, subject, text, html }) {
  if (process.env.EMAIL_ENABLED !== "true") return { skipped: true };
  const transporter = nodemailer.createTransport({
    service: "gmail", // or your email provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS?.replace(/\s/g, ""),
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
}

// Sample endpoint to send a reminder email for an event (for demonstration)
router.post(
  "/send-reminder/:eventId",
  authenticateToken,
  requireAdmin,
  requireEventOwner,
  async (req, res) => {
    try {
      if (process.env.EMAIL_ENABLED !== "true")
        return res.status(503).json({ message: "Email delivery is disabled." });
      const { eventId } = req.params;
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      // Find all registrations for this event
      const registrations = await Registration.find({ eventId }).populate(
        "studentId",
      );
      for (const reg of registrations) {
        if (reg.studentId && reg.studentId.email) {
          await sendEmail({
            to: reg.studentId.email,
            subject: `Reminder: Upcoming Event - ${event.title}`,
            text: `Dear ${reg.studentId.name},\n\nThis is a reminder for the event: ${event.title} on ${event.date}.\nVenue: ${event.venue}\n\nSee you there!`,
          });
        }
      }
      res.json({ message: "Reminders sent!" });
    } catch (error) {
      console.error("Error sending reminders:", error);
      res.status(500).json({ message: "Failed to send reminders" });
    }
  },
);

// Register for event
router.post(
  "/:eventId([a-fA-F0-9]{24})",
  authenticateToken,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const studentId = req.user._id;
      if (req.user.role !== "student")
        return res
          .status(403)
          .json({ message: "Only students can register for events." });

      // Check if event exists
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (
        event.date <= new Date() ||
        ["completed", "archived"].includes(event.status)
      )
        return res
          .status(400)
          .json({ message: "Registration has closed for this event." });

      // Check if event is full
      if (event.currentRegistrations >= event.capacity) {
        return res.status(400).json({ message: "Event is full" });
      }

      // Check if already registered
      const existingRegistration = await Registration.findOne({
        studentId,
        eventId,
      });

      if (existingRegistration) {
        return res
          .status(400)
          .json({ message: "Already registered for this event" });
      }

      // Create QR code data
      const qrPayload = {
        studentId: studentId.toString(),
        eventId: eventId.toString(),
        timestamp: Date.now(),
      };

      const qrCodeData = jwt.sign(qrPayload, process.env.JWT_SECRET);

      // Generate QR code image
      const qrCodeImage = await QRCode.toDataURL(qrCodeData);

      // Create registration
      const registration = new Registration({
        studentId,
        eventId,
        qrCodeData,
      });

      await registration.save();

      // Update event registration count
      event.currentRegistrations += 1;
      await event.save();

      // Notify only the organiser responsible for this event
      const admins = await User.find({ _id: event.createdBy, role: "admin" });
      const student = await User.findById(studentId);
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        message: `${student.name} (${student.email}) registered for event: ${event.title}`,
        type: "event_update",
        eventId: event._id,
      }));
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }

      // Populate registration data
      await registration.populate([
        { path: "studentId", select: "name email rollNumber" },
        { path: "eventId", select: "title date venue" },
      ]);

      res.status(201).json({
        message: "Registration successful",
        registration,
        qrCodeImage,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  },
);

// Get user's registrations
router.get(
  "/my-registrations",
  authenticateToken,
  requireStudent,
  async (req, res) => {
    try {
      const registrations = await Registration.find({ studentId: req.user._id })
        .populate("eventId", "title date venue posterUrl")
        .sort({ createdAt: -1 });

      // Generate QR codes for each registration
      const registrationsWithQR = await Promise.all(
        registrations.map(async (reg) => {
          const qrCodeImage = await QRCode.toDataURL(reg.qrCodeData);
          return {
            ...reg.toObject(),
            qrCodeImage,
          };
        }),
      );

      res.json(registrationsWithQR);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get event registrations (Admin only)
router.get(
  "/event/:eventId",
  authenticateToken,
  requireAdmin,
  requireEventOwner,
  async (req, res) => {
    try {
      const registrations = await Registration.find({
        eventId: req.params.eventId,
      })
        .populate("studentId", "name email rollNumber profilePic")
        .sort({ createdAt: -1 });

      res.json(registrations);
    } catch (error) {
      console.error("Error fetching event registrations:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Export event registrations as CSV (Admin only)
router.get(
  "/export/:eventId",
  authenticateToken,
  requireAdmin,
  requireEventOwner,
  async (req, res) => {
    try {
      const registrations = await Registration.find({
        eventId: req.params.eventId,
      })
        .populate("studentId", "name email rollNumber")
        .sort({ createdAt: -1 });

      if (!registrations.length) {
        return res
          .status(404)
          .json({ message: "No registrations found for this event" });
      }

      const data = registrations.map((reg) => ({
        Name: reg.studentId?.name || "-",
        Email: reg.studentId?.email || "-",
        RollNumber: reg.studentId?.rollNumber || "-",
        RegisteredAt: reg.createdAt,
        Status: reg.isScanned ? "Scanned" : "Pending",
      }));

      const json2csv = new Json2csvParser({
        fields: ["Name", "Email", "RollNumber", "RegisteredAt", "Status"],
      });
      const csv = json2csv.parse(data);

      res.header("Content-Type", "text/csv");
      res.attachment("registrations.csv");
      return res.send(csv);
    } catch (error) {
      console.error("Error exporting registrations:", error);
      res.status(500).json({ message: "Server error during export" });
    }
  },
);

// Create a notification for a user
router.post("/notify", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    const notification = new Notification({
      user: userId,
      message,
      type: type || "other",
    });
    await notification.save();
    res.status(201).json({ message: "Notification created", notification });
  } catch (error) {
    console.error("Notification creation error:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

// Get notifications for the logged-in user
router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Mark a notification as read
router.patch("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true },
    );
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

export { sendEmail };
export default router;
