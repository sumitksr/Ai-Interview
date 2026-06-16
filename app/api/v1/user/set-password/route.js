import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";
import bcrypt from "bcryptjs";

// Shared OTP store — must match the same global as send-otp
const otpStore = global._otpStore || (global._otpStore = new Map());

// POST /api/v1/user/set-password
export async function POST(req) {
  const decoded = await getAuthUser();
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { otp, newPassword } = await req.json();

  if (!otp || !newPassword) {
    return NextResponse.json({ error: "OTP and new password are required." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const storedEntry = otpStore.get(decoded.id);
  if (!storedEntry) {
    return NextResponse.json({ error: "No OTP found. Please request a new one." }, { status: 400 });
  }

  if (Date.now() > storedEntry.expiresAt) {
    otpStore.delete(decoded.id);
    return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
  }

  if (storedEntry.otp !== otp.trim()) {
    return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
  }

  // OTP is valid — hash and save the password
  await connectDB();
  const saltRounds = Number(process.env.N) || 10;
  const hashed = await bcrypt.hash(newPassword, saltRounds);

  await User.findByIdAndUpdate(decoded.id, { password: hashed });
  otpStore.delete(decoded.id);

  return NextResponse.json({ message: "Password set successfully. You can now log in with email & password." });
}
