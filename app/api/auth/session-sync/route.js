import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret_key_for_development";

/**
 * Called by the client after NextAuth OAuth redirect.
 * Reads the active NextAuth session and sets the access token, refresh token,
 * isLoggedIn, and userInfo cookies that AuthContext + API routes depend on.
 */
async function syncSession() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await connectDB();

  let dbUser = null;
  if (session.user.dbId) {
    dbUser = await User.findById(session.user.dbId);
  }
  if (!dbUser && session.user.email) {
    const normalizedEmail = session.user.email.toLowerCase();
    dbUser = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    });
  }

  const userId = dbUser?._id?.toString() || session.user.dbId;
  const role = dbUser?.role || session.user.role || "user";
  const name = dbUser?.name || session.user.name || "";
  const email = dbUser?.email || session.user.email || "";
  const image = dbUser?.image || session.user.image || "";

  if (!userId) {
    return NextResponse.json({ ok: false, error: "User ID not found" }, { status: 400 });
  }

  const token = jwt.sign(
    { id: userId, role, email, name, image },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { id: userId, role },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "30d" }
  );

  const userInfoObj = { name, image: image || "", role };
  const userInfoString = JSON.stringify(userInfoObj);

  const res = NextResponse.json({
    ok: true,
    message: "Session synced successfully",
    name,
    image: image || "",
    role,
    token,
    refreshToken,
    userInfo: userInfoObj,
  });

  res.cookies.set("token", token, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24,
  });
  res.cookies.set("refreshToken", refreshToken, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.set("isLoggedIn", "true", {
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  res.cookies.set("userInfo", userInfoString, {
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}

export async function GET() {
  return syncSession();
}

export async function POST() {
  return syncSession();
}
