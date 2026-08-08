import { NextResponse } from "next/server";
import { connectDB, Teacher, Booking, Review } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";

/**
 * GET /api/v1/admin/mentors
 * Admin-only. Returns all teachers with full stats.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (authUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const teachers = await Teacher.find({})
      .populate("user", "name email image createdAt")
      .lean();

    const teacherIds = teachers.map((t) => t._id);

    const [allBookings, allReviews] = await Promise.all([
      Booking.find({ teacher: { $in: teacherIds } })
        .select("teacher status amountPaid paymentStatus scheduledDate")
        .lean(),
      Review.find({ teacher: { $in: teacherIds } })
        .select("teacher rating comment user createdAt")
        .populate("user", "name image")
        .lean(),
    ]);

    // Group by teacherId
    const bookingsByTeacher = {};
    const reviewsByTeacher = {};
    for (const b of allBookings) {
      const tid = b.teacher.toString();
      if (!bookingsByTeacher[tid]) bookingsByTeacher[tid] = [];
      bookingsByTeacher[tid].push(b);
    }
    for (const r of allReviews) {
      const tid = r.teacher.toString();
      if (!reviewsByTeacher[tid]) reviewsByTeacher[tid] = [];
      reviewsByTeacher[tid].push(r);
    }

    const shaped = teachers.map((t) => {
      const tid = t._id.toString();
      const bookings = bookingsByTeacher[tid] || [];
      const reviews = reviewsByTeacher[tid] || [];
      const earnings = bookings
        .filter((b) => b.paymentStatus === "paid")
        .reduce((s, b) => s + (b.amountPaid || 0), 0);
      const avgRating =
        reviews.length > 0
          ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
          : 0;

      return {
        _id: t._id,
        username: t.username,
        bio: t.bio,
        expertise: t.expertise,
        fees: t.fees,
        user: t.user,
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter((b) => b.status !== "cancelled").length,
        earnings,
        avgRating,
        totalReviews: reviews.length,
        reviews: reviews.slice(0, 5), // preview latest 5
        createdAt: t.createdAt,
      };
    });

    return NextResponse.json({ mentors: shaped }, { status: 200 });
  } catch (err) {
    console.error("GET /api/v1/admin/mentors error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/admin/mentors
 * Admin-only. Edit a mentor's fees, bio, or expertise.
 * Body: { teacherId, fees?, bio?, expertise? }
 */
export async function PATCH(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (authUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { teacherId, fees, bio, expertise } = await req.json();
    if (!teacherId) return NextResponse.json({ error: "teacherId required" }, { status: 400 });

    await connectDB();
    const update = {};
    if (fees !== undefined) update.fees = fees;
    if (bio !== undefined) update.bio = bio;
    if (expertise !== undefined) update.expertise = expertise;

    const updated = await Teacher.findByIdAndUpdate(teacherId, update, { new: true })
      .populate("user", "name email")
      .lean();

    if (!updated) return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    return NextResponse.json({ success: true, mentor: updated }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/v1/admin/mentors error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
