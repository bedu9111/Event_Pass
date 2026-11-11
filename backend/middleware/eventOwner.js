import mongoose from "mongoose";
import Event from "../models/Event.js";

// Use after authentication and requireAdmin for organiser-only operations.
export const requireEventOwner = async (req, res, next) => {
  const id = req.params.eventId || req.params.id;
  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ message: "Invalid event ID." });
  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    if (String(event.createdBy) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You can only manage events you organise." });
    }
    req.event = event;
    next();
  } catch (error) {
    next(error);
  }
};
