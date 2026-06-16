import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

// GET /api/v1/user/profile
export async function GET() {
  const decoded = await getAuthUser();
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(decoded.id).select("-password -refreshToken");
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
  const decoded = await getAuthUser();
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name } = body;

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(
    decoded.id,
    { name: name.trim() },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const response = NextResponse.json({ message: "Profile updated", name: user.name });
  // Update the userInfo cookie
  response.cookies.set("userInfo", JSON.stringify({ name: user.name, image: user.image || "" }), {
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
