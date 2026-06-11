import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
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

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        comment: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent a user from reviewing the same teacher more than once
reviewSchema.index(
    { user: 1, teacher: 1 },
    { unique: true }
);

const Review =
    mongoose.models.Review ||
    mongoose.model("Review", reviewSchema);

export default Review;