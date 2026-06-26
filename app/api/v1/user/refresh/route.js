import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, User } from "@/imports";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret_key_for_development";

export async function POST(req) {
  try {
    const refreshTokenCookie = req.cookies.get("refreshToken")?.value;

    if (!refreshTokenCookie) {
      return NextResponse.json({ error: "Refresh token not found." }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshTokenCookie, REFRESH_TOKEN_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired refresh token." }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const newAccessToken = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const response = NextResponse.json({ message: "Token refreshed successfully" }, { status: 200 });
    
    response.cookies.set("token", newAccessToken, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
