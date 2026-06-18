import mongoose from "mongoose";

const availableSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
  },
  startTime: {
    type: String, // e.g. "10:00"
    required: true,
  },
  endTime: {
    type: String, // e.g. "11:00"
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
});

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
    },

    bio: {
      type: String,
      default: "",
    },

    expertise: {
      type: [String],
      default: [],
    },

    fees: {
      type: Number,
      required: true,
    },

    availableSlots: {
      type: [availableSlotSchema],
      default: [],
    },

    reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Teacher ||
  mongoose.model("Teacher", teacherSchema);