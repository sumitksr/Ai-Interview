import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import jwt from "jsonwebtoken";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${url.origin}/login?error=OAuthCodeMissing`);

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = `${url.origin}/api/v1/user/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token");

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();

    await connectDB();

    const normalizedEmail = profileData.email.toLowerCase();

    // Case-insensitive email match to avoid duplicates when same email used for normal signup
    let user = await User.findOne({
      $or: [
        { googleId: profileData.id },
        { email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } },
      ],
    });

    if (!user) {
      user = new User({
        name: profileData.name,
        email: normalizedEmail,
        googleId: profileData.id,
        image: profileData.picture,
        role: "user",
      });
      await user.save();
    } else {
      // Link Google account to existing user and update image if missing
      let changed = false;
      if (!user.googleId) { user.googleId = profileData.id; changed = true; }
      if (!user.image && profileData.picture) { user.image = profileData.picture; changed = true; }
      if (changed) await user.save();
    }

    const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    const response = NextResponse.redirect(`${url.origin}/dashboard`);
    response.cookies.set("token", token, { path: "/", httpOnly: true, maxAge: 60 * 60 * 24 });
    response.cookies.set("isLoggedIn", "true", { path: "/", maxAge: 60 * 60 * 24 });
    response.cookies.set("userInfo", JSON.stringify({ name: user.name, image: user.image }), { path: "/", maxAge: 60 * 60 * 24 });

    return response;
  } catch (error) {
    console.error("Google OAuth Error:", error);
    return NextResponse.redirect(`${url.origin}/login?error=OAuthFailed`);
  }
}
