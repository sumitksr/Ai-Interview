import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
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
 * POST /api/v1/user/signup
 *
 * Accepts { name, email, password }
 * Creates the user account immediately (no OTP).
 * Sends a verification email with a magic link (3-day expiry).
 * Returns auth cookies so the user is logged in right away.
 */
export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Check if email is already registered ──────────────────────────────────
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

    // ── Hash password ─────────────────────────────────────────────────────────
    const saltRounds = Number(process.env.N) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ── Generate verification token (3-day expiry) ────────────────────────────
    const verificationToken = crypto.randomUUID();
    const verificationExpires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // ── Create user in DB immediately ─────────────────────────────────────────
    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      isVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await newUser.save();

    // ── Send welcome + verification emails (non-blocking) ─────────────────────
    sendWelcomeEmail(newUser.email, newUser.name).catch((e) =>
      console.error("sendWelcomeEmail error:", e)
    );
    sendVerificationEmail(newUser.email, newUser.name, verificationToken).catch(
      (e) => console.error("sendVerificationEmail error:", e)
    );

    // ── Issue auth tokens ─────────────────────────────────────────────────────
    const token = jwt.sign(
      {
        id: newUser._id,
        role: newUser.role,
        email: newUser.email,
        name: newUser.name,
        image: newUser.image || "",
        isVerified: false,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: newUser._id, role: newUser.role },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    // Persist refreshToken to DB
    newUser.refreshToken = refreshToken;
    await newUser.save();

    const response = NextResponse.json(
      {
        message: "Signup successful",
        name: newUser.name,
        image: newUser.image || "",
        role: newUser.role,
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
        name: newUser.name,
        image: newUser.image || "",
        role: newUser.role,
        isVerified: false,
      }),
      { path: "/", maxAge: 60 * 60 * 24 }
    );

    return response;
  } catch (error) {
    console.error("signup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
