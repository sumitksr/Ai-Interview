import { NextResponse } from "next/server";
import { Teacher, User, connectDB } from "@/imports";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendWelcomeEmail } from "@/lib/sendWelcomeEmail";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_secret_key_for_development";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ||
  "fallback_refresh_secret_key_for_development";

/**
 * POST /api/v1/user/signup/teacher
 *
 * Accepts { name, email, username, fees, password }
 * Creates User + Teacher docs immediately (no OTP).
 * Sends a verification email with a magic link (3-day expiry).
 * Returns auth cookies so the teacher is logged in right away.
 */
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

    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
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

    // ── Hash password ─────────────────────────────────────────────────────────
    const saltRounds = Number(process.env.N) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ── Generate verification token (3-day expiry) ────────────────────────────
    const verificationToken = crypto.randomUUID();
    const verificationExpires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // ── Create User doc ───────────────────────────────────────────────────────
    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "teacher",
      isVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    const savedUser = await newUser.save();

    // ── Create Teacher doc ────────────────────────────────────────────────────
    const newTeacher = new Teacher({
      user: savedUser._id,
      username: username.trim(),
      fees: Number(fees) || 0,
    });

    await newTeacher.save();

    // ── Send welcome + verification emails (non-blocking) ─────────────────────
    sendWelcomeEmail(savedUser.email, savedUser.name).catch((e) =>
      console.error("sendWelcomeEmail error:", e)
    );
    sendVerificationEmail(
      savedUser.email,
      savedUser.name,
      verificationToken
    ).catch((e) => console.error("sendVerificationEmail error:", e));

    // ── Issue auth tokens ─────────────────────────────────────────────────────
    const token = jwt.sign(
      {
        id: savedUser._id,
        role: savedUser.role,
        email: savedUser.email,
        name: savedUser.name,
        image: savedUser.image || "",
        isVerified: false,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    // Persist refreshToken to DB
    savedUser.refreshToken = refreshToken;
    await savedUser.save();

    const response = NextResponse.json(
      {
        message: "Teacher Signup successful",
        name: savedUser.name,
        image: savedUser.image || "",
        role: savedUser.role,
        needsEmailVerification: true,
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
        isVerified: false,
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
