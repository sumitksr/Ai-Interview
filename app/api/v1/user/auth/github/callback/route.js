import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import jwt from "jsonwebtoken";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${url.origin}/login?error=OAuthCodeMissing`);

  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const REDIRECT_URI = `${url.origin}/api/v1/user/auth/github/callback`;

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token");

    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();

    let email = profileData.email;
    if (!email) {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const emails = await emailRes.json();
      const primaryEmail = emails.find(e => e.primary) || emails[0];
      email = primaryEmail?.email;
    }

    if (!email) throw new Error("No email found from GitHub");

    await connectDB();

    const normalizedEmail = email.toLowerCase();

    // Case-insensitive email match to avoid duplicates when same email used for normal signup
    let user = await User.findOne({
      $or: [
        { githubId: profileData.id.toString() },
        { email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } },
      ],
    });

    if (!user) {
      user = new User({
        name: profileData.name || profileData.login,
        email: normalizedEmail,
        githubId: profileData.id.toString(),
        image: profileData.avatar_url,
        role: "user",
      });
      await user.save();
    } else {
      // Link GitHub account to existing user and update image if missing
      let changed = false;
      if (!user.githubId) { user.githubId = profileData.id.toString(); changed = true; }
      if (!user.image && profileData.avatar_url) { user.image = profileData.avatar_url; changed = true; }
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
    console.error("GitHub OAuth Error:", error);
    return NextResponse.redirect(`${url.origin}/login?error=OAuthFailed`);
  }
}
