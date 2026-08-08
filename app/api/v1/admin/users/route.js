import { NextResponse } from "next/server";
import { connectDB, User, UserData } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";

/**
 * GET /api/v1/admin/users
 * Admin-only. Returns all users with their performance data.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (authUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const users = await User.find({})
      .select("name email image role createdAt googleId githubId")
      .sort({ createdAt: -1 })
      .lean();

    const userDataList = await UserData.find({
      user: { $in: users.map((u) => u._id) },
    })
      .select("user interviewsTaken averageScore interviewHistory")
      .lean();

    const userDataMap = {};
    for (const ud of userDataList) {
      userDataMap[ud.user.toString()] = ud;
    }

    const shaped = users.map((u) => {
      const ud = userDataMap[u._id.toString()];
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        image: u.image || null,
        role: u.role,
        createdAt: u.createdAt,
        provider: u.googleId ? "Google" : u.githubId ? "GitHub" : "Email",
        interviewsTaken: ud?.interviewsTaken || 0,
        averageScore: ud?.averageScore || 0,
        interviewHistory: (ud?.interviewHistory || []).map((h) => ({
          date: h.date,
          targetRole: h.targetRole,
          score: h.score,
          hiringRecommendation: h.hiringRecommendation,
        })),
      };
    });

    return NextResponse.json({ users: shaped }, { status: 200 });
  } catch (err) {
    console.error("GET /api/v1/admin/users error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/admin/users
 * Admin-only. Update a user's role.
 * Body: { userId, role }
 */
export async function PATCH(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (authUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { userId, role } = await req.json();
    if (!userId || !["user", "admin", "teacher"].includes(role)) {
      return NextResponse.json({ error: "Invalid userId or role" }, { status: 400 });
    }

    await connectDB();
    const updated = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("_id name email role").lean();
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/v1/admin/users error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/users
 * Admin-only. Supports two actions via query param ?action=
 *   - terminate-session : clears the user's refreshToken in DB, forcing re-login on next refresh
 *   - terminate-user    : permanently deletes the user document from DB
 * Body: { userId }
 */
export async function DELETE(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (authUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    await connectDB();

    if (action === "terminate-session") {
      // Clear refreshToken so the user's next token refresh will fail → forced logout
      const updated = await User.findByIdAndUpdate(
        userId,
        { $unset: { refreshToken: "" } },
        { new: true }
      ).select("_id name email").lean();
      if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({ success: true, message: `Session terminated for ${updated.name}` }, { status: 200 });
    }

    if (action === "terminate-user") {
      // Prevent admin from deleting themselves
      if (userId === authUser.id) {
        return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
      }
      const deleted = await User.findByIdAndDelete(userId).select("_id name email").lean();
      if (!deleted) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({ success: true, message: `User ${deleted.name} has been removed.` }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action. Use ?action=terminate-session or ?action=terminate-user" }, { status: 400 });
  } catch (err) {
    console.error("DELETE /api/v1/admin/users error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
