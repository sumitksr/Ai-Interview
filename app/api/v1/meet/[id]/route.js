import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectDB } from "@/imports";
import Booking from "@/models/Booking";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { bookid: id }] }
      : { bookid: id };

    const booking = await Booking.findOne(query).populate("teacher");

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify if the current user is either the student or the teacher
    const userId = authUser.id;
    const isStudent = booking.user.toString() === userId;
    const isMentor = booking.teacher && booking.teacher.user.toString() === userId;

    if (!isStudent && !isMentor) {
      return NextResponse.json(
        { error: "Forbidden: You don't have access to this meeting" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Meeting access error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
