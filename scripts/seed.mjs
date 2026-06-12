import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Teacher from "../models/Teacher.js";
import UserData from "../models/UserData.js";
import Booking from "../models/Booking.js";
import Review from "../models/reviews.js";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Error: MONGO_URI is missing in the environment variables.");
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    // console.log("Clearing existing data...");
    // await User.deleteMany({});
    // await Teacher.deleteMany({});
    // await UserData.deleteMany({});
    // await Booking.deleteMany({});
    // await Review.deleteMany({});
    // console.log("Existing data cleared.");

    console.log("Seeding Users...");
    const saltRounds = Number(process.env.N) || 10;

    const hashedPassword = await bcrypt.hash(
      "password123",
      saltRounds
    );
    const users = await User.insertMany([
      { name: "Admin User", email: "admin@example.com", password: hashedPassword, role: "admin" },
      { name: "John Doe", email: "student1@example.com", password: hashedPassword, role: "user" },
      { name: "Jane Smith", email: "student2@example.com", password: hashedPassword, role: "user" },
      { name: "Alice Teacher", email: "teacher1@example.com", password: hashedPassword, role: "teacher" },
      { name: "Bob Mentor", email: "teacher2@example.com", password: hashedPassword, role: "teacher" },
    ]);

    const student1 = users[1];
    const student2 = users[2];
    const teacherUser1 = users[3];
    const teacherUser2 = users[4];

    console.log("Seeding Teachers...");
    const teachers = await Teacher.insertMany([
      { user: teacherUser1._id, username: "alice_t", fees: 50, reviews: [] },
      { user: teacherUser2._id, username: "bob_m", fees: 80, reviews: [] },
    ]);

    const teacher1 = teachers[0];
    const teacher2 = teachers[1];

    console.log("Seeding UserData (Interviews)...");
    await UserData.insertMany([
      {
        user: student1._id,
        interviewsTaken: 2,
        averageScore: 85,
        interviewHistory: [
          {
            date: new Date(),
            score: 80,
            resume: "http://example.com/resume1.pdf",
            questions: [
              { question: "What is React?", answer: "A UI library.", mistake: "Too brief.", feedback: "Elaborate more on its component-based architecture." }
            ]
          },
          {
            date: new Date(Date.now() - 86400000), // 1 day ago
            score: 90,
            resume: "http://example.com/resume1.pdf",
            questions: [
              { question: "Explain Closures", answer: "Function returning function.", mistake: "Missed scope explanation.", feedback: "Mention lexical scoping." }
            ]
          }
        ]
      },
      {
        user: student2._id,
        interviewsTaken: 1,
        averageScore: 92,
        interviewHistory: [
          {
            date: new Date(),
            score: 92,
            resume: "http://example.com/resume2.pdf",
            questions: [
              { question: "What is Node.js?", answer: "JS runtime.", mistake: "None.", feedback: "Good answer." }
            ]
          }
        ]
      }
    ]);

    console.log("Seeding Bookings...");
    await Booking.insertMany([
      { user: student1._id, teacher: teacher1._id, scheduledDate: new Date(Date.now() + 86400000), status: "pending", meetingLink: "http://zoom.us/j/123" },
      { user: student2._id, teacher: teacher2._id, scheduledDate: new Date(Date.now() - 86400000), status: "completed", feedback: "Great session!" }
    ]);

    console.log("Seeding Reviews...");
    const review1 = await Review.create({ user: student2._id, teacher: teacher2._id, rating: 5, comment: "Bob is an excellent mentor!" });
    
    teacher2.reviews.push(review1._id);
    await teacher2.save();

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
