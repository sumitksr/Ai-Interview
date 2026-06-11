import  mongoose from 'mongoose';

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
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'teacher'],
        default: 'user',
    },
    refreshToken: {
        type: String,
    },
    role :{
        type: String,
    }
    
}, { timestamps: true });

export default mongoose.models.User ||
mongoose.model("User", userSchema);
