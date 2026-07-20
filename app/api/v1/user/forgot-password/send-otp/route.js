import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import nodemailer from "nodemailer";

// Shared OTP store for forgot-password flow (global persists across hot reloads)
// In production, use Redis instead.
const fpOtpStore = global._fpOtpStore || (global._fpOtpStore = new Map());

// POST /api/v1/user/forgot-password/send-otp
// Public — no auth required. Accepts { email } and sends OTP to that address.
export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
    });

    // For security, always respond with the same message whether or not the user exists.
    // But we only actually send if the user exists.
    if (user) {
      // Check if user has a password (can only reset password-based accounts)
      if (!user.password) {
        return NextResponse.json(
          { error: "This account uses Google/GitHub login and has no password to reset. Please log in with your social account." },
          { status: 400 }
        );
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      fpOtpStore.set(user._id.toString(), { otp, expiresAt, email: user.email });

      // Send OTP email
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"AI Interview Platform" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: "Reset your PrepAI password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0f1c;padding:32px;border-radius:16px;border:1px solid #263246;">
            <h2 style="color:#2dd4bf;margin-top:0;">Reset Your Password</h2>
            <p style="color:#cbd6e4;">We received a request to reset your PrepAI account password. Use the OTP below — it expires in <strong>10 minutes</strong>.</p>
            <div style="background:#172033;border:1px solid #263246;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
              <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#f4f7fb;">${otp}</span>
            </div>
            <p style="color:#97a6ba;font-size:13px;">If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      message: "If an account with that email exists, an OTP has been sent.",
    });
  } catch (error) {
    console.error("forgot-password/send-otp error:", error);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
