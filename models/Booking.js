import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
{
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
    },
    teacher: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Teacher",
        required: true
    },
    scheduledDate: { 
        type: Date,
        required: true
    },
    status: { 
        type: String, 
        enum: ["pending", "confirmed", "completed", "cancelled"], 
        default: "pending" 
    },
    meetingLink: { 
        type: String 
    },
    feedback: { 
        type: String 
    }
},
{
    timestamps: true,
}
);

export default mongoose.models.Booking ||
mongoose.model("Booking", bookingSchema);
