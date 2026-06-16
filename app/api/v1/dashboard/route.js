import { NextResponse } from "next/server";
import { connectDB, User, UserData } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(authUser.id).select("-password -__v");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let userData = await UserData.findOne({ user: user._id }).select("-__v");

    if (!userData) {
      userData = await UserData.create({
        user: user._id,
        interviewsTaken: 0,
        averageScore: 0,
        interviewHistory: [],
      });
    }

    return NextResponse.json({ user, userData }, { status: 200 });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
