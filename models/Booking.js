import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    // Slot details — denormalized for fast dashboard display
    slotId: {
      type: String,
      default: "",
    },
    startTime: {
      type: String, // e.g. "10:00"
      default: "",
    },
    endTime: {
      type: String, // e.g. "11:00"
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "confirmed",
    },
    meetingLink: {
      type: String,
      default: "",
    },
    feedback: {
      type: String,
      default: "",
    },
    // Payment fields
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
