import { NextResponse } from "next/server";
import { connectDB, Teacher, Booking, User } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";
import {
  sendBookingConfirmationToStudent,
  sendBookingNotificationToTeacher,
  sendAdminMeetFailureAlert,
} from "@/lib/sendBookingEmail";
import { createGoogleMeetEvent } from "@/lib/googleCalendar";

import crypto from "crypto";

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
 * Body: { teacherId, date (ISO string), slotId?, startTime?, endTime?, razorpay_order_id, razorpay_payment_id, razorpay_signature }
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

    // ── Email verification gate ───────────────────────────────────────────────
    const bookingUser = await User.findById(authUser.id).select("isVerified");
    if (!bookingUser?.isVerified) {
      return NextResponse.json(
        {
          error: "Please verify your email before booking a mentor session.",
          emailNotVerified: true,
        },
        { status: 403 }
      );
    }

    const {
      teacherId,
      date: dateStr,
      slotId,
      startTime,
      endTime,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!teacherId || !dateStr || (!slotId && (!startTime || !endTime))) {
      return NextResponse.json(
        { error: "teacherId, date, and slotId (or start/endTime) are required" },
        { status: 400 }
      );
    }

    // ── 1. Fetch teacher ──────────────────────────────────────────────────────
    const teacher = await Teacher.findById(teacherId).populate(
      "user",
      "name email"
    );
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // ── 2. Payment verification ───────────────────────────────────────────────
    if (teacher.fees && teacher.fees > 0) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
          { error: "Payment details are required" },
          { status: 400 }
        );
      }

      // Verify Razorpay signature
      const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET?.trim())
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature !== razorpay_signature) {
        return NextResponse.json(
          { error: "Payment verification failed. Invalid signature." },
          { status: 400 }
        );
      }
    }

    // ── 3. Validate the 20-day window ────────────────────────────────────────
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
    const bookid = crypto.randomBytes(5).toString("hex");
    const booking = await Booking.create({
      user: authUser.id,
      teacher: teacherId,
      scheduledDate: targetDate,
      slotId: (slot._id || slotId || "").toString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: "confirmed",
      bookid: bookid,
      razorpayOrderId: razorpay_order_id || "",
      razorpayPaymentId: razorpay_payment_id || "",
      razorpaySignature: razorpay_signature || "",
      paymentStatus: teacher.fees && teacher.fees > 0 ? "paid" : "free",
      amountPaid: teacher.fees || 0,
    });

    // ── 7. Mark slot as booked ────────────────────────────────────────────────
    slot.isBooked = true;
    slot.bookingId = booking._id;
    await teacher.save();

    // ── 8. Auto-generate Google Meet link via Calendar API (with retry) ────────
    // Build IST datetime strings for the Calendar event
    const dateKey = targetDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const startISO = `${dateKey}T${slot.startTime}:00+05:30`;
    const endISO   = `${dateKey}T${slot.endTime}:00+05:30`;

    const MAX_RETRIES = 3;
    const RETRY_DELAYS_MS = [1000, 4000, 8000]; // exponential backoff: 2s, 4s, 8s

    let googleMeetLink = "";
    let lastCalError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { meetLink } = await createGoogleMeetEvent({
          summary: `Interview Session: ${student.name} with ${teacher.user.name}`,
          startISO,
          endISO,
          attendeeEmails: [student.email, teacher.user.email],
          description: `Booked via Ace AI Interview Platform.\nBooking ID: ${bookid}`,
        });
        googleMeetLink = meetLink;
        lastCalError = null;
        // Save the real Google Meet link to the booking document
        booking.meetingLink = googleMeetLink;
        await booking.save();
        console.log(`[Google Calendar] Meet link created on attempt ${attempt}.`);
        break; // success — exit retry loop
      } catch (calErr) {
        lastCalError = calErr;
        console.error(
          `[Google Calendar] Attempt ${attempt}/${MAX_RETRIES} failed:`,
          calErr.message
        );
        if (attempt < MAX_RETRIES) {
          // Wait before next retry
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
        }
      }
    }

    // All retries exhausted — send admin alert so it can be fixed manually
    if (lastCalError) {
      console.error(
        "[Google Calendar] All retries failed. Sending admin alert.",
        lastCalError.message
      );
      const formattedScheduledDate = targetDate.toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      sendAdminMeetFailureAlert({
        bookingId: booking._id.toString(),
        bookid,
        studentName: student.name,
        studentEmail: student.email,
        teacherName: teacher.user.name,
        scheduledDate: formattedScheduledDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        errorMessage: lastCalError.message,
      }).catch((e) => console.error("Admin alert email error:", e));
    }

    // ── 9. Send emails (non-blocking) ─────────────────────────────────────────
    // Emails link to our secure /meet/:bookid redirect (NOT the raw Google Meet URL)
    const meetingLink = `${process.env.NEXTAUTH_URL}/meet/${bookid}`;

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
      meetingLink,
      startISO,
      endISO,
    });

    sendBookingNotificationToTeacher({
      teacherEmail: teacher.user.email,
      teacherName: teacher.user.name,
      studentName: student.name,
      studentEmail: student.email,
      day: dateLabel,
      startTime: slot.startTime,
      endTime: slot.endTime,
      meetingLink,
      startISO,
      endISO,
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

