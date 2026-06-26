import { NextResponse } from "next/server";
import { Teacher,User ,connectDB } from "@/imports";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";

export async function POST(req) {
  try {
    const { name, email, username, fees, password } = await req.json();
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use." }, { status: 400 });
    }

    const existingTeacher = await Teacher.findOne({ username });
    if (existingTeacher) {
      return NextResponse.json({ error: "Username already taken." }, { status: 400 });
    }

    const saltRounds = Number(process.env.N) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "teacher",
    });

    const savedUser = await newUser.save();

    const newTeacher = new Teacher({
      user: savedUser._id,
      username,
      fees: Number(fees),
    });

    await newTeacher.save();

    const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret_key_for_development";
    const refreshToken = jwt.sign({ id: savedUser._id, role: savedUser.role }, REFRESH_TOKEN_SECRET, {
      expiresIn: "30d",
    });

    const response = NextResponse.json(
      { message: "Teacher Signup successful", name: savedUser.name, image: savedUser.image || "", role: savedUser.role },
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
    response.cookies.set("userInfo", JSON.stringify({ name: savedUser.name, image: savedUser.image || "", role: savedUser.role }), {
      path: "/",
      maxAge: 60 * 60 * 24, 
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
