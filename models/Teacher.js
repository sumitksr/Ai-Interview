import mongoose from "mongoose";

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

    fees: {
        type: Number,
        required: true,
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