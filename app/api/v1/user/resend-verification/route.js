import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";
import crypto from "crypto";

/**
 * POST /api/v1/user/resend-verification
 *
 * Authenticated endpoint — resends the verification email with a fresh token.
 * Rate-limited: 60-second cooldown between sends.
 */
export async function POST() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Email is already verified." },
        { status: 200 }
      );
    }

    // Rate-limit: 60-second cooldown
    if (
      user.emailVerificationExpires &&
      user.emailVerificationToken
    ) {
      // Calculate when the last token was generated (expiry minus 3 days)
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
      const lastSentAt = new Date(
        user.emailVerificationExpires.getTime() - THREE_DAYS_MS
      );
      const elapsed = Date.now() - lastSentAt.getTime();
      if (elapsed < 60_000) {
        const waitSecs = Math.ceil((60_000 - elapsed) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${waitSecs} seconds before requesting another verification email.`,
          },
          { status: 429 }
        );
      }
    }

    // Generate new token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, user.name, token);

    return NextResponse.json({
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("resend-verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }
}
