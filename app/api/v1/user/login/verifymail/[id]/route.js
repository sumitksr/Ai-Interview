import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_secret_key_for_development";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ||
  "fallback_refresh_secret_key_for_development";

/**
 * GET /api/v1/user/login/verifymail/:id
 *
 * Verifies a user's email via the token sent in the verification email.
 * - Looks up user by emailVerificationToken
 * - Checks token hasn't expired (3-day TTL)
 * - Sets isVerified = true, clears token fields (one-time use)
 * - Auto-logs the user in by setting auth cookies
 * - Redirects to homepage with ?verified=true
 */
export async function GET(req, { params }) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    const { id: token } = await params;

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/login?verifyError=missing`);
    }

    await connectDB();

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      // Token not found or expired — redirect to login gracefully
      return NextResponse.redirect(`${baseUrl}/login?verifyError=expired`);
    }

    // ── Mark as verified & clear token (one-time use — can't reuse link) ─────
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    // ── Auto-login: issue JWT + refresh token cookies ────────────────────────
    const accessToken = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name,
        image: user.image || "",
        isVerified: true,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user._id.toString(), role: user.role },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    // Persist refreshToken to DB
    user.refreshToken = refreshToken;
    await user.save();

    console.log(`Email verified & auto-logged in: ${user.email}`);

    // ── Set auth cookies & redirect ──────────────────────────────────────────
    const response = NextResponse.redirect(`${baseUrl}/?verified=true`);

    response.cookies.set("token", accessToken, {
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
        name: user.name,
        image: user.image || "",
        role: user.role,
        isVerified: true,
      }),
      { path: "/", maxAge: 60 * 60 * 24 }
    );

    return response;
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(`${baseUrl}/login?verifyError=error`);
  }
}
