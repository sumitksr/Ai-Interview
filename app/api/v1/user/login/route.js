import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    await connectDB();
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email.trim()}$`, "i") } });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name, image: user.image || "" }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret_key_for_development";
    const refreshToken = jwt.sign({ id: user._id, role: user.role, }, REFRESH_TOKEN_SECRET, {
      expiresIn: "30d",
    });

    const response = NextResponse.json({ message: "Login successful", name: user.name, image: user.image || "", role: user.role }, { status: 200 });
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
    response.cookies.set("userInfo", JSON.stringify({ name: user.name, image: user.image || "", role: user.role }), {
        path: "/",
        maxAge: 60 * 60 * 24, 
      });
    
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
