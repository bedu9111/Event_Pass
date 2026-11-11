import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run create-admin -- your-email@example.com");
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGO_URL);
  const user = await User.findOneAndUpdate(
    { email },
    { role: "admin" },
    { new: true },
  );
  if (!user)
    throw new Error(
      "Register this account in the app first, then run this command.",
    );
  console.log("Account promoted to organiser. Sign out and sign in again.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
