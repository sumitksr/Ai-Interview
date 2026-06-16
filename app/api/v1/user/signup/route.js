import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "@/lib/sendWelcomeEmail";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";

export async function POST(req) {
  try {
    const { name, email, targetRole, password } = await req.json();
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use." }, { status: 400 });
    }
    const saltRounds = Number(process.env.N) || 10;


    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    await newUser.save();

    // Send welcome email without blocking the response
    sendWelcomeEmail(newUser.email, newUser.name);

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const response = NextResponse.json({ message: "Signup successful", name: newUser.name, image: newUser.image || "" }, { status: 201 });
    response.cookies.set("token", token, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24, 
    });
    response.cookies.set("isLoggedIn", "true", {
      path: "/",
      maxAge: 60 * 60 * 24, 
    });
    response.cookies.set("userInfo", JSON.stringify({ name: newUser.name, image: newUser.image || "" }), {
      path: "/",
      maxAge: 60 * 60 * 24, 
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
