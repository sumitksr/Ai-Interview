import { NextResponse } from "next/server";
import { connectDB, Teacher } from "@/imports";

/**
 * GET /api/v1/teacher
 * Returns all teachers with their user info, bio, expertise, fees, and available slots.
 * Public endpoint — no auth required.
 */
export async function GET() {
  try {
    await connectDB();

    const teachers = await Teacher.find({})
      .populate("user", "name email image")
      .lean();

    return NextResponse.json({ teachers }, { status: 200 });
  } catch (error) {
    console.error("GET /api/v1/teacher error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
