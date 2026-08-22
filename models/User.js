import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String, // Optional for OAuth users
    },
    image: {
        type: String, // Store profile picture URL
        default: "",
    },
    googleId: {
        type: String,
    },
    githubId: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'teacher'],
        default: 'user',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: {
        type: String,
    },
    emailVerificationExpires: {
        type: Date,
    },
    refreshToken: {
        type: String,
    }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
