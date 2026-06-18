import { NextResponse } from "next/server";
import { connectDB, Teacher } from "@/imports";

/**
 * GET /api/v1/teacher/[id]
 * Returns a single teacher's full profile.
 */
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const teacher = await Teacher.findById(id)
      .populate("user", "name email image")
      .lean();

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({ teacher }, { status: 200 });
  } catch (error) {
    console.error("GET /api/v1/teacher/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
