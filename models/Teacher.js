import mongoose from "mongoose";
import { availabilityEntrySchema } from "./Availability.js";

const workExperienceSchema = new mongoose.Schema({
  position: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, default: "" },
  isCurrent: { type: Boolean, default: false },
  description: { type: String, default: "" },
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
      default: 0,
    },

    /**
     * Date-specific availability entries.
     * Each entry covers one calendar date and holds
     * its time slots + an optional "blocked" flag.
     * Saturdays and Sundays within the next 20 days are
     * auto-seeded with a default 10:00–11:00 slot by the
     * GET /api/v1/teacher/availability endpoint.
     */
    availability: {
      type: [availabilityEntrySchema],
      default: [],
    },

    workExperiences: {
      type: [workExperienceSchema],
      default: [],
    },

    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Teacher ||
  mongoose.model("Teacher", teacherSchema);