import mongoose from "mongoose";

if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined in environment variables');
    process.exit(1); 
}

const MONGO_URI = process.env.MONGO_URI;

// Maintain a cached connection across hot reloads in development
// and serverless invocations in production.
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    // If we already have an active connection, reuse it
    if (cached.conn) {
        return cached.conn;
    }

    // If no connection is in progress, start a new one
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGO_URI, opts).then((mongooseInstance) => {
            console.log('✅ MongoDB connected successfully (reused/new connection cached)');
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null; // Clear promise on error so we can retry on next request
        console.error('❌ MongoDB connection error:', error);
        throw error; // Throw error instead of process.exit(1) to avoid killing the server process
    }

    return cached.conn;
};

export default connectDB;