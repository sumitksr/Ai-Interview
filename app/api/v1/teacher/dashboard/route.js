import { NextResponse } from "next/server";
import { connectDB, Teacher, Booking, Review } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";

/**
 * GET /api/v1/teacher/dashboard
 *
 * Mentor-only. Returns:
 * {
 *   teacher,
 *   bookings: [...],
 *   reviews: [...],
 *   stats: { totalBookings, totalEarnings, upcomingCount, averageRating }
 * }
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (authUser.role !== "teacher") {
      return NextResponse.json(
        { error: "Forbidden: teachers only" },
        { status: 403 }
      );
    }

    await connectDB();

    const teacher = await Teacher.findOne({ user: authUser.id })
      .populate("user", "name email image")
      .lean();

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    // All bookings for this teacher
    const bookings = await Booking.find({ teacher: teacher._id })
      .populate("user", "name email image")
      .sort({ scheduledDate: -1 })
      .lean();

    // All reviews for this teacher
    const reviews = await Review.find({ teacher: teacher._id })
      .populate("user", "name image")
      .sort({ createdAt: -1 })
      .lean();

    // ── Stats ──────────────────────────────────────────────────────────────
    const now = new Date();
    const totalBookings = bookings.length;
    const totalEarnings = bookings
      .filter((b) => b.status !== "cancelled")
      .length * (teacher.fees || 0);

    const upcomingCount = bookings.filter(
      (b) =>
        new Date(b.scheduledDate) >= now &&
        b.status !== "cancelled" &&
        b.status !== "completed"
    ).length;

    const averageRating =
      reviews.length > 0
        ? parseFloat(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          )
        : 0;

    return NextResponse.json(
      {
        teacher,
        bookings,
        reviews,
        stats: { totalBookings, totalEarnings, upcomingCount, averageRating },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/v1/teacher/dashboard error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
