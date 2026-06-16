import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";

// GET /api/v1/user/profile
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(authUser.id).select("-password -refreshToken");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    name: user.name,
    email: user.email,
    image: user.image || "",
    hasPassword: !!user.password,
    provider: user.googleId ? "google" : user.githubId ? "github" : "email",
    googleId: !!user.googleId,
    githubId: !!user.githubId,
    role: user.role,
    createdAt: user.createdAt,
  });
}

// PATCH /api/v1/user/profile
export async function PATCH(req) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name } = body;

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(
    authUser.id,
    { name: name.trim() },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const response = NextResponse.json({ message: "Profile updated", name: user.name });
  response.cookies.set("userInfo", JSON.stringify({ name: user.name, image: user.image || "" }), {
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
