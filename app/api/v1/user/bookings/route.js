import { NextResponse } from "next/server";
import { connectDB } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";
import Booking from "@/models/Booking";

/**
 * GET /api/v1/user/bookings
 * Returns all bookings for the currently authenticated student,
 * sorted newest first, with teacher name/email populated.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const bookings = await Booking.find({ user: authUser.id })
      .populate({
        path: "teacher",
        populate: { path: "user", select: "name email image" },
      })
      .sort({ scheduledDate: -1, createdAt: -1 })
      .lean();

    // Shape the response — expose only what the client needs
    const shaped = bookings.map((b) => ({
      _id: b._id,
      bookid: b.bookid,
      status: b.status,
      paymentStatus: b.paymentStatus,
      amountPaid: b.amountPaid,
      scheduledDate: b.scheduledDate,
      startTime: b.startTime,
      endTime: b.endTime,
      // Use our /meet/:bookid redirect URL — never expose raw Google Meet link
      meetLink: b.bookid
        ? `${process.env.NEXTAUTH_URL || "https://aceai.sumitksr.xyz"}/meet/${b.bookid}`
        : null,
      hasMeetLink: !!b.meetingLink, // tells client if the real gmeet link exists
      teacher: b.teacher
        ? {
            name: b.teacher.user?.name || "Mentor",
            email: b.teacher.user?.email || "",
            image: b.teacher.user?.image || null,
            expertise: b.teacher.expertise || [],
            fees: b.teacher.fees || 0,
          }
        : null,
    }));

    return NextResponse.json({ bookings: shaped }, { status: 200 });
  } catch (error) {
    console.error("GET /api/v1/user/bookings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
