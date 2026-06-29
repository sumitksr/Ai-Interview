import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectDB } from "@/imports";
import Booking from "@/models/Booking";
import Teacher from "@/models/Teacher";
import User from "@/models/User";
import { sendMeetingRescheduleEmail } from "@/lib/sendBookingEmail";

/**
 * PATCH /api/v1/teacher/book/reschedule
 * Body: { bookingId, newStartTime, newEndTime }
 *
 * Allows a mentor to update the start/end time of a confirmed booking.
 * Sends an email notification to the student automatically.
 */
export async function PATCH(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, newDate, newStartTime, newEndTime } = await req.json();

    // Basic validation
    if (!bookingId || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: "bookingId, newStartTime and newEndTime are required" },
        { status: 400 }
      );
    }

    // Validate time format HH:MM and logical order
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(newStartTime) || !timeRegex.test(newEndTime)) {
      return NextResponse.json(
        { error: "Times must be in HH:MM format" },
        { status: 400 }
      );
    }
    if (newStartTime >= newEndTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }
    
    let parsedDate = null;
    if (newDate) {
      parsedDate = new Date(newDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // Find the booking and verify the caller is the teacher for this booking
    const booking = await Booking.findById(bookingId).populate({
      path: "teacher",
      populate: { path: "user", select: "name email" },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only the teacher who owns this booking can reschedule it
    if (!booking.teacher || booking.teacher.user._id.toString() !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      return NextResponse.json(
        { error: `Cannot reschedule a ${booking.status} booking` },
        { status: 400 }
      );
    }

    // Save old times for the email
    const oldStartTime = booking.startTime;
    const oldEndTime = booking.endTime;
    const oldDateStr = new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Update times and date
    booking.startTime = newStartTime;
    booking.endTime = newEndTime;
    if (parsedDate) {
      booking.scheduledDate = parsedDate;
    }
    await booking.save();

    // Fetch student details for the email
    const student = await User.findById(booking.user).select("name email");
    if (student) {
      const teacherName = booking.teacher.user.name || "Your Mentor";
      const newDateStr = parsedDate ? parsedDate.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) : oldDateStr;

      // Build meeting link (same logic as the meet page)
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const meetingLink = `${baseUrl}/meet/${booking._id.toString()}`;

      sendMeetingRescheduleEmail({
        studentEmail: student.email,
        studentName: student.name,
        teacherName,
        oldDay: oldDateStr,
        newDay: newDateStr,
        oldStartTime,
        oldEndTime,
        newStartTime,
        newEndTime,
        meetingLink,
      }).catch((e) => console.error("Reschedule email error:", e));
    }

    return NextResponse.json({
      success: true,
      booking: {
        _id: booking._id,
        scheduledDate: booking.scheduledDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
    });
  } catch (error) {
    console.error("Reschedule error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
