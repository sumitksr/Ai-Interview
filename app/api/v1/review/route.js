import { NextResponse } from "next/server";
import { connectDB } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";
import Booking from "@/models/Booking";
import Review from "@/models/reviews";

/**
 * GET /api/v1/review
 * Returns all reviews the current user has submitted,
 * keyed by teacherId so the dashboard can look them up.
 * { reviewed: { [teacherId]: { rating, comment, createdAt } } }
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const reviews = await Review.find({ user: authUser.id })
      .select("teacher rating comment createdAt")
      .lean();

    // Map teacherId → review data
    const reviewed = {};
    for (const r of reviews) {
      reviewed[r.teacher.toString()] = {
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      };
    }

    return NextResponse.json({ reviewed }, { status: 200 });
  } catch (error) {
    console.error("GET /api/v1/review error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/v1/review
 * Create a new review for a teacher.
 * The user must have at least one non-cancelled booking with this teacher.
 * Body: { teacherId, rating (1-5), comment? }
 */
export async function POST(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teacherId, rating, comment } = await req.json();

    if (!teacherId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "teacherId and a rating between 1 and 5 are required." },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the user has actually had a session with this teacher
    const booking = await Booking.findOne({
      user: authUser.id,
      teacher: teacherId,
      status: { $ne: "cancelled" },
    }).lean();

    if (!booking) {
      return NextResponse.json(
        { error: "You can only review a mentor you have booked a session with." },
        { status: 403 }
      );
    }

    // Check if review already exists (should use PUT to update instead)
    const existing = await Review.findOne({ user: authUser.id, teacher: teacherId });
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this mentor. Use PUT to update your review." },
        { status: 409 }
      );
    }

    const review = await Review.create({
      user: authUser.id,
      teacher: teacherId,
      rating,
      comment: comment?.trim() || "",
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "You have already reviewed this mentor." },
        { status: 409 }
      );
    }
    console.error("POST /api/v1/review error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT /api/v1/review
 * Edit an existing review.
 * Body: { teacherId, rating (1-5), comment? }
 */
export async function PUT(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teacherId, rating, comment } = await req.json();

    if (!teacherId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "teacherId and a rating between 1 and 5 are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const review = await Review.findOneAndUpdate(
      { user: authUser.id, teacher: teacherId },
      { rating, comment: comment?.trim() || "" },
      { new: true }
    );

    if (!review) {
      return NextResponse.json(
        { error: "No existing review found for this mentor. Use POST to create one." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, review }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/v1/review error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
