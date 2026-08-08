import { NextResponse } from "next/server";
import { connectDB, User, Teacher, Booking, UserData } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";

/**
 * GET /api/v1/admin/stats
 * Admin-only. Returns platform-wide stats for the dashboard overview.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (authUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const [
      totalUsers,
      totalTeachers,
      totalBookings,
      recentUsers,
      allBookings,
      allUserData,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Teacher.countDocuments(),
      Booking.countDocuments(),
      // Users signed up in last 7 days
      User.find({
        role: "user",
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }).select("createdAt").lean(),
      Booking.find().select("status amountPaid paymentStatus scheduledDate createdAt").lean(),
      UserData.find().select("averageScore interviewsTaken").lean(),
    ]);

    const totalRevenue = allBookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + (b.amountPaid || 0), 0);

    const confirmedBookings = allBookings.filter((b) => b.status !== "cancelled").length;
    const cancelledBookings = allBookings.filter((b) => b.status === "cancelled").length;
    const completedBookings = allBookings.filter((b) => b.status === "completed").length;

    const platformAvgScore =
      allUserData.length > 0
        ? Math.round(
            allUserData.reduce((s, d) => s + (d.averageScore || 0), 0) / allUserData.length
          )
        : 0;

    const totalInterviews = allUserData.reduce((s, d) => s + (d.interviewsTaken || 0), 0);

    // Build last-7-days signup chart data
    const signupsByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      signupsByDay[d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })] = 0;
    }
    recentUsers.forEach((u) => {
      const key = new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (key in signupsByDay) signupsByDay[key]++;
    });
    const signupChart = Object.entries(signupsByDay).map(([date, count]) => ({ date, count }));

    // Booking status breakdown for pie
    const bookingStatusBreakdown = [
      { name: "Confirmed", value: confirmedBookings - completedBookings, color: "#22c55e" },
      { name: "Completed", value: completedBookings, color: "#38bdf8" },
      { name: "Cancelled", value: cancelledBookings, color: "#ef4444" },
    ];

    return NextResponse.json({
      stats: {
        totalUsers,
        totalTeachers,
        totalBookings,
        totalRevenue,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        platformAvgScore,
        totalInterviews,
        newUsersThisWeek: recentUsers.length,
      },
      signupChart,
      bookingStatusBreakdown,
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/v1/admin/stats error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
