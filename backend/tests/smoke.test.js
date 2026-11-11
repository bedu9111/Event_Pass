import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import net from "node:net";
import User from "../models/User.js";

// Tests never use the developer's database or external email/image services.
test(
  "student registration through organiser check-in",
  { timeout: 30000 },
  async () => {
    const dbName = `eventpass_test_${randomUUID().replaceAll("-", "")}`;
    const uri = `mongodb://127.0.0.1:27017/${dbName}`;
    const probe = net.createServer();
    probe.listen(0, "127.0.0.1");
    await once(probe, "listening");
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    const server = spawn(process.execPath, ["server.js"], {
      cwd: new URL("../", import.meta.url),
      env: {
        ...process.env,
        PORT: String(port),
        MONGO_URL: uri,
        JWT_SECRET: randomUUID(),
        EMAIL_ENABLED: "false",
      },
      stdio: "ignore",
    });
    const base = `http://127.0.0.1:${port}/api`;
    const request = async (
      path,
      method = "GET",
      body,
      token,
      expected = 200,
    ) => {
      const res = await fetch(base + path, {
        method,
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      assert.equal(res.status, expected, `${method} ${path}: ${res.status}`);
      return res.headers.get("content-type")?.includes("application/json")
        ? res.json()
        : res.text();
    };
    try {
      await mongoose.connect(uri);
      await User.init();
      let ready = false;
      for (let i = 0; i < 60; i++) {
        try {
          if ((await fetch(`http://127.0.0.1:${port}/`)).ok) {
            ready = true;
            break;
          }
        } catch {}
        await delay(100);
      }
      assert.ok(ready, "API started");
      const studentData = {
        name: "Test Student",
        email: "student@example.test",
        password: "Test-password-829",
        rollNumber: "TEST-01",
      };
      await request(
        "/auth/register",
        "POST",
        { ...studentData, role: "invalid" },
        null,
        400,
      );
      const student = await request(
        "/auth/register",
        "POST",
        studentData,
        null,
        201,
      );
      await request("/auth/register", "POST", studentData, null, 400);
      await request(
        "/auth/login",
        "POST",
        { email: studentData.email, password: "wrong" },
        null,
        400,
      );
      const organiser = await request(
        "/auth/register",
        "POST",
        {
          ...studentData,
          name: "Test Organiser",
          email: "organiser@example.test",
          role: "admin",
          rollNumber: undefined,
        },
        null,
        201,
      );
      assert.equal(organiser.user.role, "admin");
      assert.equal(organiser.user.rollNumber, undefined);
      await request(
        "/auth/register",
        "POST",
        { ...studentData, email: "missing-roll@example.test", rollNumber: "" },
        null,
        400,
      );
      const secondOrganiser = await request(
        "/auth/register",
        "POST",
        {
          name: "Second Organiser",
          email: "second@example.test",
          password: studentData.password,
          role: "admin",
        },
        null,
        201,
      );
      assert.equal(secondOrganiser.user.role, "admin");
      await request(
        "/registrations/my-registrations",
        "GET",
        null,
        organiser.token,
        403,
      );
      await request("/events/mine", "GET", null, student.token, 403);
      const eventData = {
        title: "Campus design workshop",
        description: "A practical afternoon of interface design.",
        date: new Date(Date.now() + 86400000).toISOString(),
        venue: "Design studio",
        capacity: 20,
      };
      await request("/events", "POST", eventData, student.token, 403);
      const created = await request(
        "/events",
        "POST",
        eventData,
        organiser.token,
        201,
      );
      const event = created.event || created;
      assert.ok(event._id, "event ID returned");
      const secondCreated = await request(
        "/events",
        "POST",
        { ...eventData, title: "Second organiser event" },
        secondOrganiser.token,
        201,
      );
      const secondEvent = secondCreated.event;
      const allEvents = await request("/events");
      assert.ok(allEvents.some((e) => e._id === event._id));
      assert.ok(allEvents.some((e) => e._id === secondEvent._id));
      const owned = await request("/events/mine", "GET", null, organiser.token);
      assert.deepEqual(
        owned.map((e) => e._id),
        [event._id],
      );
      const secondOwned = await request(
        "/events/mine",
        "GET",
        null,
        secondOrganiser.token,
      );
      assert.deepEqual(
        secondOwned.map((e) => e._id),
        [secondEvent._id],
      );
      await request(
        `/events/${event._id}`,
        "PUT",
        eventData,
        secondOrganiser.token,
        403,
      );
      await request(
        `/events/${event._id}`,
        "DELETE",
        null,
        secondOrganiser.token,
        403,
      );
      await request(`/events/${event._id}`, "PUT", eventData, organiser.token);
      await request(
        `/registrations/event/${event._id}`,
        "GET",
        null,
        secondOrganiser.token,
        403,
      );
      await request(
        `/registrations/export/${event._id}`,
        "GET",
        null,
        secondOrganiser.token,
        403,
      );
      await request(
        `/registrations/send-reminder/${event._id}`,
        "POST",
        {},
        secondOrganiser.token,
        403,
      );
      await request(
        `/registrations/${event._id}`,
        "POST",
        {},
        organiser.token,
        403,
      );
      await request(
        `/registrations/${secondEvent._id}`,
        "POST",
        {},
        organiser.token,
        403,
      );

      await request(
        `/registrations/event/${event._id}`,
        "GET",
        null,
        student.token,
        403,
      );
      await request(
        `/registrations/export/${event._id}`,
        "GET",
        null,
        student.token,
        403,
      );
      const registration = await request(
        `/registrations/${event._id}`,
        "POST",
        {},
        student.token,
        201,
      );
      assert.match(registration.qrCodeImage, /^data:image\/png;base64,/);
      await request(
        `/registrations/${event._id}`,
        "POST",
        {},
        student.token,
        400,
      );
      const notices = await request(
        "/registrations/notifications",
        "GET",
        null,
        secondOrganiser.token,
      );
      assert.equal(
        notices.notifications.filter((n) => n.eventId === event._id).length,
        0,
      );
      const ownerNotices = await request(
        "/registrations/notifications",
        "GET",
        null,
        organiser.token,
      );
      assert.ok(
        ownerNotices.notifications.some((n) => n.eventId === event._id),
      );
      await request(
        "/scan",
        "POST",
        { qrCodeData: registration.registration.qrCodeData },
        secondOrganiser.token,
        403,
      );
      const mine = await request(
        "/registrations/my-registrations",
        "GET",
        null,
        student.token,
      );
      assert.equal(mine.length, 1);
      const profile = new FormData();
      profile.append("name", "Updated Student");
      const update = await fetch(`${base}/auth/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${student.token}` },
        body: profile,
      });
      assert.equal(update.status, 200);
      assert.equal((await update.json()).user.name, "Updated Student");
      await request(
        "/scan",
        "POST",
        { qrCodeData: registration.registration.qrCodeData },
        student.token,
        403,
      );
      await request(
        "/scan",
        "POST",
        { qrCodeData: "invalid" },
        organiser.token,
        400,
      );
      await request(
        "/scan",
        "POST",
        { qrCodeData: registration.registration.qrCodeData },
        organiser.token,
      );
      await request(
        "/scan",
        "POST",
        { qrCodeData: registration.registration.qrCodeData },
        organiser.token,
        400,
      );
      const csv = await request(
        `/registrations/export/${event._id}`,
        "GET",
        null,
        organiser.token,
      );
      assert.match(csv, /Updated Student/);
      assert.match(csv, /Scanned/);
      await request(
        `/registrations/${secondEvent._id}`,
        "POST",
        {},
        student.token,
        201,
      );
      const passes = await request(
        "/registrations/my-registrations",
        "GET",
        null,
        student.token,
      );
      assert.equal(passes.length, 2);
      await request(
        `/events/${secondEvent._id}`,
        "DELETE",
        null,
        secondOrganiser.token,
      );
      const remainingPasses = await request(
        "/registrations/my-registrations",
        "GET",
        null,
        student.token,
      );
      assert.equal(remainingPasses.length, 1);
      const past = await request(
        "/events",
        "POST",
        { ...eventData, date: new Date(Date.now() - 86400000).toISOString() },
        organiser.token,
        201,
      );
      await request(
        `/registrations/${(past.event || past)._id}`,
        "POST",
        {},
        student.token,
        400,
      );
    } finally {
      server.kill("SIGTERM");
      if (server.exitCode === null && server.signalCode === null)
        await once(server, "exit");
      if (mongoose.connection.readyState === 1)
        await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  },
);
