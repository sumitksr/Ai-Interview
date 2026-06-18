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

            targetRole: { 
                type: String, 
                default: "" 
            },
            experienceLevel: { 
                type: String, 
                default: "" 
            },
            focus: { 
                type: String, 
                default: "" 
            },

            score: { 
                type: Number 
            },
            resume: { 
                type: String, 
                default: "" 
            },      
            resumeText: { 
                type: String, default: "" 
            },  

            overallSummary: { 
                type: String, default: "" 
            },
            strengths: [
                { 
                    type: String
                }
            ],
            areasForImprovement: [
                { 
                    type: String 
                }
            ],
            hiringRecommendation: { 
                type: String, 
                default: "" 
            },
            nextSteps: { 
                type: String, 
                default: "" 
            },

            questions: [
                {
                    question: String,
                    answer: String,
                    score: Number,
                    feedback: String,
                    mistake: String,
                    betterApproach: String,
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