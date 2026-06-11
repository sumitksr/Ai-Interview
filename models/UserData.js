import mongoose from "mongoose";

const userDataSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },

    interviewsTaken: {
        type: Number,
        default: 0,
    },

    averageScore: {
        type: Number,
        default: 0,
    },

    interviewHistory: [
        {
            date: {
                type: Date,
                default: Date.now,
            },

            score: {
                type: Number,
            },
            resume: {
                type: String,
            },

            questions: [
                {
                    question: String,
                    answer: String,
                    mistake: String,
                    feedback: String,
                },
            ],
        },
    ],
},
{
    timestamps: true,
}
);

export default mongoose.models.UserData ||
mongoose.model("UserData", userDataSchema);