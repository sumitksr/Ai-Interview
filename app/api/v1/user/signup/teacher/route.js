import { NextResponse } from "next/server";
import { Teacher,User ,connectDB } from "@/imports";
import bcrypt from "bcryptjs";

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

    const hashedPassword = await bcrypt.hash(password, 10);

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

    const response = NextResponse.json({ message: "Teacher Signup successful" }, { status: 201 });
    response.cookies.set("isLoggedIn", "true", {
      path: "/",
      maxAge: 60 * 60 * 24, 
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
