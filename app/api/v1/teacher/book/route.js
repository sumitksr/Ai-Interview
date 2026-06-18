import { NextResponse } from "next/server";
import { connectDB, Teacher, Booking, User } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";
import {
  sendBookingConfirmationToStudent,
  sendBookingNotificationToTeacher,
} from "@/lib/sendBookingEmail";

/** Return "YYYY-MM-DD" for any Date or ISO string — timezone-safe */
function toDateKey(d) {
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10); // "2026-06-21"
}

function toMidnightUTC(d) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/**
 * POST /api/v1/teacher/book
 *
 * Body: { teacherId, date (ISO string), slotId?, startTime?, endTime? }
 */
export async function POST(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized — please log in first" },
        { status: 401 }
      );
    }

    await connectDB();

    const { teacherId, date: dateStr, slotId, startTime, endTime } = await req.json();

    if (!teacherId || !dateStr || (!slotId && (!startTime || !endTime))) {
      return NextResponse.json(
        { error: "teacherId, date, and slotId (or start/endTime) are required" },
        { status: 400 }
      );
    }

    // ── 1. Validate the 20-day window ────────────────────────────────────────
    const today = toMidnightUTC(new Date());
    const maxDate = new Date(today);
    maxDate.setUTCDate(maxDate.getUTCDate() + 19); // inclusive

    const targetDate = toMidnightUTC(new Date(dateStr));

    if (targetDate < today || targetDate > maxDate) {
      return NextResponse.json(
        { error: "Bookings are only allowed within the next 20 days" },
        { status: 400 }
      );
    }

    // ── 2. Fetch teacher ──────────────────────────────────────────────────────
    const teacher = await Teacher.findById(teacherId).populate(
      "user",
      "name email"
    );
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // ── 3. Find the availability entry for this date ──────────────────────────
    if (!teacher.availability) {
      teacher.availability = [];
    }

    const targetKey = toDateKey(targetDate);

    const entry = teacher.availability.find(
      (a) => toDateKey(a.date) === targetKey
    );

    if (!entry) {
      return NextResponse.json(
        { error: "No availability found for this date" },
        { status: 404 }
      );
    }

    if (entry.isUnavailable) {
      return NextResponse.json(
        { error: "The mentor is unavailable on this date" },
        { status: 409 }
      );
    }

    // ── 4. Find the slot ──────────────────────────────────────────────────────
    let slot;
    if (slotId) {
      slot = entry.slots.id(slotId);
    }
    // Fallback: match by start/end time
    if (!slot && startTime && endTime) {
      slot = entry.slots.find(
        (s) => s.startTime === startTime && s.endTime === endTime
      );
    }

    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }
    if (slot.isBooked) {
      return NextResponse.json(
        { error: "This slot has already been booked" },
        { status: 409 }
      );
    }

    // ── 5. Fetch student ──────────────────────────────────────────────────────
    const student = await User.findById(authUser.id).select("name email");
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // ── 6. Create booking ─────────────────────────────────────────────────────
    const booking = await Booking.create({
      user: authUser.id,
      teacher: teacherId,
      scheduledDate: targetDate,
      slotId: (slot._id || slotId || "").toString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: "confirmed",
    });

    // ── 7. Mark slot as booked ────────────────────────────────────────────────
    slot.isBooked = true;
    slot.bookingId = booking._id;
    await teacher.save();

    // ── 8. Send emails (non-blocking) ─────────────────────────────────────────
    const dateLabel = targetDate.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    sendBookingConfirmationToStudent({
      studentEmail: student.email,
      studentName: student.name,
      teacherName: teacher.user.name,
      day: dateLabel,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });

    sendBookingNotificationToTeacher({
      teacherEmail: teacher.user.email,
      teacherName: teacher.user.name,
      studentName: student.name,
      studentEmail: student.email,
      day: dateLabel,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });

    return NextResponse.json(
      {
        message: "Session booked successfully! Confirmation emails have been sent.",
        bookingId: booking._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/v1/teacher/book error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

