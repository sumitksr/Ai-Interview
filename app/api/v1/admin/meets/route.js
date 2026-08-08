import { NextResponse } from "next/server";
import { connectDB, Booking } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";

/**
 * GET /api/v1/admin/meets
 * Admin-only. Returns all bookings with user + teacher info.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (authUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const bookings = await Booking.find({})
      .populate({ path: "user", select: "name email image" })
      .populate({ path: "teacher", populate: { path: "user", select: "name email image" } })
      .sort({ scheduledDate: -1 })
      .lean();

    const shaped = bookings.map((b) => ({
      _id: b._id,
      bookid: b.bookid,
      status: b.status,
      paymentStatus: b.paymentStatus,
      amountPaid: b.amountPaid,
      scheduledDate: b.scheduledDate,
      startTime: b.startTime,
      endTime: b.endTime,
      meetingLink: b.meetingLink || "",
      hasMeetLink: !!b.meetingLink,
      createdAt: b.createdAt,
      student: b.user
        ? { _id: b.user._id, name: b.user.name, email: b.user.email, image: b.user.image }
        : null,
      mentor: b.teacher
        ? {
            _id: b.teacher._id,
            name: b.teacher.user?.name || "Mentor",
            email: b.teacher.user?.email || "",
            image: b.teacher.user?.image || null,
            fees: b.teacher.fees,
          }
        : null,
    }));

    return NextResponse.json({ meets: shaped }, { status: 200 });
  } catch (err) {
    console.error("GET /api/v1/admin/meets error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/admin/meets
 * Admin-only. Update booking status.
 * Body: { bookingId, status }
 */
export async function PATCH(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (authUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { bookingId, status } = await req.json();
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!bookingId || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid bookingId or status" }, { status: 400 });
    }

    await connectDB();
    const updated = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    return NextResponse.json({ success: true, booking: updated }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/v1/admin/meets error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
