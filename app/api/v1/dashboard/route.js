import { NextResponse } from "next/server";
import { connectDB, User, UserData } from "@/imports";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";

export async function GET(req) {
  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = tokenCookie.value;
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.id).select("-password -__v");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let userData = await UserData.findOne({ user: user._id }).select("-__v");
    
    // If user data doesn't exist yet, we can create a default or return an empty state
    if (!userData) {
      userData = await UserData.create({
        user: user._id,
        interviewsTaken: 0,
        averageScore: 0,
        interviewHistory: [],
      });
    }

    return NextResponse.json({
      user,
      userData,
    }, { status: 200 });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
