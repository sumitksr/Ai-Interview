import { NextResponse } from "next/server";
import { connectDB, Teacher } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";

/**
 * PATCH /api/v1/teacher/profile
 *
 * Lets a teacher update their bio, expertise, fees, and username.
 * Body: { bio?, expertise?, fees?, username? }
 */
export async function PATCH(req) {
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

    const body = await req.json();
    const { bio, expertise, fees, username, workExperiences } = body;

    const updateFields = {};
    if (workExperiences !== undefined && Array.isArray(workExperiences)) {
      updateFields.workExperiences = workExperiences.map(exp => ({
        position: exp.position?.trim() || "",
        company: exp.company?.trim() || "",
        startDate: exp.startDate?.trim() || "",
        endDate: exp.endDate?.trim() || "",
        isCurrent: Boolean(exp.isCurrent),
        description: exp.description?.trim() || "",
      })).filter(exp => exp.position && exp.company && exp.startDate);
    }
    
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (expertise !== undefined)
      updateFields.expertise = expertise
        .map((e) => e.trim())
        .filter(Boolean);
    if (fees !== undefined) {
      const parsed = parseFloat(fees);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: "fees must be a non-negative number" },
          { status: 400 }
        );
      }
      updateFields.fees = parsed;
    }
    if (username !== undefined) {
      const slug = username.trim().toLowerCase().replace(/\s+/g, "_");
      // Check uniqueness
      const existing = await Teacher.findOne({
        username: slug,
        user: { $ne: authUser.id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
      updateFields.username = slug;
    }

    const teacher = await Teacher.findOneAndUpdate(
      { user: authUser.id },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate("user", "name email image");

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ teacher }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/v1/teacher/profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
