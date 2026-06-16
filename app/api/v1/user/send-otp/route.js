import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";

// Shared OTP store across route modules (global persists across hot reloads)
// In production, use Redis instead.
const otpStore = global._otpStore || (global._otpStore = new Map());

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// POST /api/v1/user/send-otp  — Send OTP to user's email
export async function POST(req) {
  const decoded = await getAuthUser();
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(decoded.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.password) {
    return NextResponse.json({ error: "Password already set. Use login instead." }, { status: 400 });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(user._id.toString(), { otp, expiresAt });

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
    subject: "Your OTP to set your password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0f1c;padding:32px;border-radius:16px;border:1px solid #263246;">
        <h2 style="color:#2dd4bf;margin-top:0;">Set Your Password</h2>
        <p style="color:#cbd6e4;">Use the OTP below to set a password for your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#172033;border:1px solid #263246;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#f4f7fb;">${otp}</span>
        </div>
        <p style="color:#97a6ba;font-size:13px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });

  return NextResponse.json({ message: "OTP sent to your email." });
}
