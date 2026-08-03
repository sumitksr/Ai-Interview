import { NextResponse } from "next/server";
import { Teacher, User, connectDB } from "@/imports";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "@/lib/sendWelcomeEmail";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_secret_key_for_development";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ||
  "fallback_refresh_secret_key_for_development";

/**
 * Shared reference to the teacher signup OTP store (set by send-otp route).
 * Keyed by normalized email → { name, email, username, fees, hashedPassword, otp, expiresAt, attempts }
 */
const teacherSignupOtpStore =
  global._teacherSignupOtpStore ||
  (global._teacherSignupOtpStore = new Map());

const MAX_ATTEMPTS = 5;

// POST /api/v1/user/signup/teacher
// Accepts { email, otp }
// Verifies OTP → creates User + Teacher docs in DB → returns auth cookies.
export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = teacherSignupOtpStore.get(normalizedEmail);

    // ── OTP not found ─────────────────────────────────────────────────────────
    if (!record) {
      return NextResponse.json(
        { error: "No pending verification found. Please request a new OTP." },
        { status: 400 }
      );
    }

    // ── OTP expired ───────────────────────────────────────────────────────────
    if (Date.now() > record.expiresAt) {
      teacherSignupOtpStore.delete(normalizedEmail);
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // ── Too many incorrect attempts ───────────────────────────────────────────
    if (record.attempts >= MAX_ATTEMPTS) {
      teacherSignupOtpStore.delete(normalizedEmail);
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    // ── Wrong OTP ─────────────────────────────────────────────────────────────
    if (record.otp !== otp.toString().trim()) {
      record.attempts += 1;
      const remaining = MAX_ATTEMPTS - record.attempts;
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Too many incorrect attempts. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    // ── OTP valid — create User + Teacher docs ────────────────────────────────
    await connectDB();

    // Race-condition guard: re-check uniqueness right before writing
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      teacherSignupOtpStore.delete(normalizedEmail);
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 400 }
      );
    }

    const existingTeacher = await Teacher.findOne({
      username: record.username,
    });
    if (existingTeacher) {
      teacherSignupOtpStore.delete(normalizedEmail);
      return NextResponse.json(
        { error: "Username already taken. Please go back and choose another." },
        { status: 400 }
      );
    }

    const newUser = new User({
      name: record.name,
      email: normalizedEmail,
      password: record.hashedPassword,
      role: "teacher",
    });

    const savedUser = await newUser.save();

    const newTeacher = new Teacher({
      user: savedUser._id,
      username: record.username,
      fees: record.fees,
    });

    await newTeacher.save();

    // Clean up OTP record immediately after use
    teacherSignupOtpStore.delete(normalizedEmail);

    // Await so the serverless function doesn't terminate before the email sends
    await sendWelcomeEmail(savedUser.email, savedUser.name);

    // ── Issue auth tokens ─────────────────────────────────────────────────────
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    const response = NextResponse.json(
      {
        message: "Teacher Signup successful",
        name: savedUser.name,
        image: savedUser.image || "",
        role: savedUser.role,
      },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24,
    });
    response.cookies.set("refreshToken", refreshToken, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set("isLoggedIn", "true", {
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    response.cookies.set(
      "userInfo",
      JSON.stringify({
        name: savedUser.name,
        image: savedUser.image || "",
        role: savedUser.role,
      }),
      { path: "/", maxAge: 60 * 60 * 24 }
    );

    return response;
  } catch (error) {
    console.error("teacher signup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
