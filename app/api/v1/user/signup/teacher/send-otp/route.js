import { NextResponse } from "next/server";
import { connectDB, User, Teacher } from "@/imports";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

/**
 * Teacher signup OTP store — keyed by email (lowercased).
 * Stores { name, email, username, fees, hashedPassword, otp, expiresAt, sentAt, attempts }
 * No DB entry is created until OTP is verified.
 * In production, use Redis instead of this in-memory store.
 */
const teacherSignupOtpStore =
  global._teacherSignupOtpStore ||
  (global._teacherSignupOtpStore = new Map());

// POST /api/v1/user/signup/teacher/send-otp
// Public — accepts { name, email, username, fees, password }
// Validates data, hashes password, sends OTP. No DB write.
export async function POST(req) {
  try {
    const { name, email, username, fees, password } = await req.json();

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: "Name, email, username, and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Check if email or username is already taken ───────────────────────────
    await connectDB();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in.",
        },
        { status: 400 }
      );
    }

    const existingTeacher = await Teacher.findOne({
      username: username.trim(),
    });
    if (existingTeacher) {
      return NextResponse.json(
        { error: "Username already taken. Please choose a different one." },
        { status: 400 }
      );
    }

    // ── Rate-limit: 30-second cooldown between resends ────────────────────────
    const existing = teacherSignupOtpStore.get(normalizedEmail);
    if (existing && Date.now() - (existing.sentAt || 0) < 30_000) {
      return NextResponse.json(
        { error: "Please wait 30 seconds before requesting another OTP." },
        { status: 429 }
      );
    }

    // ── Hash password up front (never store plaintext in memory) ──────────────
    const saltRounds = Number(process.env.N) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ── Generate 6-digit OTP ──────────────────────────────────────────────────
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    teacherSignupOtpStore.set(normalizedEmail, {
      name,
      email: normalizedEmail,
      username: username.trim(),
      fees: Number(fees) || 0,
      hashedPassword,
      otp,
      expiresAt,
      sentAt: Date.now(),
      attempts: 0,
    });

    // ── Send OTP email ────────────────────────────────────────────────────────
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
      to: normalizedEmail,
      subject: "Verify your AI Interview Platform Mentor email",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0f1c;padding:32px;border-radius:16px;border:1px solid #263246;">
          <h2 style="color:#22d3ee;margin-top:0;">Verify your email 🎓</h2>
          <p style="color:#cbd6e4;">Hi ${name},</p>
          <p style="color:#cbd6e4;">You're one step away from becoming an AI Interview Platform Mentor! Enter the OTP below to verify your email and complete your registration. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#172033;border:1px solid #263246;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#f4f7fb;">${otp}</span>
          </div>
          <p style="color:#97a6ba;font-size:13px;">If you didn't apply to be an AI Interview Platform Mentor, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "OTP sent to your email. Please check your inbox.",
    });
  } catch (error) {
    console.error("teacher/signup/send-otp error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
