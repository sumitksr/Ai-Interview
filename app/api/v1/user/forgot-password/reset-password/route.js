import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import bcrypt from "bcryptjs";

// Shared OTP store — must match the same global as forgot-password/send-otp
const fpOtpStore = global._fpOtpStore || (global._fpOtpStore = new Map());

// POST /api/v1/user/forgot-password/reset-password
// Public — no auth required. Accepts { email, otp, newPassword } and resets the password.
export async function POST(req) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
    }

    const storedEntry = fpOtpStore.get(user._id.toString());
    if (!storedEntry) {
      return NextResponse.json(
        { error: "No OTP found for this account. Please request a new one." },
        { status: 400 }
      );
    }

    if (Date.now() > storedEntry.expiresAt) {
      fpOtpStore.delete(user._id.toString());
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (storedEntry.otp !== otp.trim()) {
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
    }

    // OTP is valid — hash and save new password
    const saltRounds = Number(process.env.N) || 10;
    const hashed = await bcrypt.hash(newPassword, saltRounds);

    await User.findByIdAndUpdate(user._id, { password: hashed });
    fpOtpStore.delete(user._id.toString());

    return NextResponse.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("forgot-password/reset-password error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
