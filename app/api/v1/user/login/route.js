import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const response = NextResponse.json({ message: "Login successful", name: user.name, image: user.image || "" }, { status: 200 });
    response.cookies.set("token", token, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24, 
      });
    response.cookies.set("isLoggedIn", "true", {
        path: "/",
        maxAge: 60 * 60 * 24, 
      });
    response.cookies.set("userInfo", JSON.stringify({ name: user.name, image: user.image || "" }), {
        path: "/",
        maxAge: 60 * 60 * 24, 
      });
    
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
