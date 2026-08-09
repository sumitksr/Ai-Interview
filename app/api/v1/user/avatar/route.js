import { NextResponse } from "next/server";
import { connectDB, User } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";
import { cloudinary } from "@/lib/cloudinary";

// POST /api/v1/user/avatar
// Body: multipart/form-data with field "avatar" (image file)
export async function POST(req) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed." }, { status: 400 });
    }

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be smaller than 5 MB." }, { status: 400 });
    }

    // Convert file to base64 data URI for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "ai-interview/avatars",
      public_id: `user_${authUser.id}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    const imageUrl = uploadResult.secure_url;

    // Save URL to DB
    await connectDB();
    const user = await User.findByIdAndUpdate(
      authUser.id,
      { image: imageUrl },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Refresh the userInfo cookie so Navbar also updates
    const response = NextResponse.json({ message: "Avatar updated", image: imageUrl });
    response.cookies.set(
      "userInfo",
      JSON.stringify({ name: user.name, image: imageUrl }),
      { path: "/", maxAge: 60 * 60 * 24 }
    );
    return response;
  } catch (err) {
    console.error("Avatar upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
