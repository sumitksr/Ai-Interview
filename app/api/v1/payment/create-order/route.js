import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { connectDB, Teacher } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID?.trim(),
  key_secret: process.env.RAZORPAY_KEY_SECRET?.trim(),
});


export async function POST(req) {
  
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized — please log in first" },
        { status: 401 }
      );
    }

    await connectDB();

    const { teacherId } = await req.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: "teacherId is required" },
        { status: 400 }
      );
    }

    const teacher = await Teacher.findById(teacherId).populate("user", "name");
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const feesInPaise = Math.round((teacher.fees || 0) * 100); // convert ₹ to paise

    const order = await razorpay.orders.create({
      amount: feesInPaise,
      currency: "INR",
      receipt: `bk_${Date.now().toString().slice(-8)}_${authUser.id.slice(-6)}`,
      notes: {
        teacherId: teacherId,
        teacherName: teacher.user?.name || "",
        userId: authUser.id,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID?.trim(),
      teacherName: teacher.user?.name,
      fees: teacher.fees,
    });
  } catch (error) {
    console.error("POST /api/v1/payment/create-order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
