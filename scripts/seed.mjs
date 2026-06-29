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

    console.log("Clearing existing data...");
    await User.deleteMany({});
    await Teacher.deleteMany({});
    await UserData.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    console.log("Existing data cleared.");

    console.log("Seeding Users...");
    const saltRounds = Number(process.env.N) || 10;
    const hashedPassword = await bcrypt.hash("password123", saltRounds);

    const users = await User.insertMany([
      { name: "Admin User", email: "admin@example.com", password: hashedPassword, role: "admin" },
      { name: "Rahul Kumar", email: "student1@example.com", password: hashedPassword, role: "user" },
      { name: "Priya Singh", email: "student2@example.com", password: hashedPassword, role: "user" },
      { name: "Arjun Sharma", email: "teacher1@example.com", password: hashedPassword, role: "teacher", image: "https://i.pravatar.cc/150?u=arjun" },
      { name: "Neha Gupta", email: "teacher2@example.com", password: hashedPassword, role: "teacher", image: "https://i.pravatar.cc/150?u=neha" },
    ]);

    const student1 = users[1];
    const student2 = users[2];
    const teacherUser1 = users[3];
    const teacherUser2 = users[4];

    console.log("Seeding Teachers...");
    const teachers = await Teacher.insertMany([
      { 
        user: teacherUser1._id, 
        username: "arjun_s", 
        fees: 1500,
        bio: "Senior Software Engineer with 8+ years of experience in distributed systems and backend architecture. I love helping candidates crack FAANG interviews.",
        expertise: ["System Design", "Node.js", "Microservices", "Data Structures"],
        workExperiences: [
          {
            position: "Senior Software Engineer",
            company: "Google",
            startDate: "2022-01",
            endDate: "",
            isCurrent: true,
            description: "- Lead the backend infrastructure for Google Cloud Storage\n- Conducted 100+ technical interviews"
          },
          {
            position: "Software Development Engineer II",
            company: "Amazon",
            startDate: "2018-06",
            endDate: "2021-12",
            isCurrent: false,
            description: "- Built scalable microservices for AWS Lambda"
          }
        ],
        reviews: [] 
      },
      { 
        user: teacherUser2._id, 
        username: "neha_g", 
        fees: 0, 
        bio: "Frontend Specialist and UI/UX enthusiast. Passionate about mentoring junior developers and open source.",
        expertise: ["React", "Next.js", "Frontend Architecture", "CSS"],
        workExperiences: [
          {
            position: "Frontend Architect",
            company: "Microsoft",
            startDate: "2021-03",
            endDate: "",
            isCurrent: true,
            description: "- Architected scalable React solutions for MS Teams\n- Mentored junior devs"
          }
        ],
        reviews: [] 
      },
    ]);

    const teacher1 = teachers[0];
    const teacher2 = teachers[1];

    console.log("Seeding UserData (Interviews)...");
    await UserData.insertMany([
      {
        user: student1._id,
        interviewsTaken: 2,
        averageScore: 82,
        interviewHistory: [
          {
            date: new Date(),
            targetRole: "Backend Developer",
            experienceLevel: "Mid-Level",
            focus: "System Design and Node.js",
            score: 80,
            resume: "http://example.com/resume1.pdf",
            overallSummary: "Good grasp of Node.js concepts but needs improvement in system design scalability.",
            strengths: ["Node.js event loop", "Database indexing"],
            areasForImprovement: ["Microservices communication", "Load balancing concepts"],
            hiringRecommendation: "Strong hire for mid-level, needs prep for senior.",
            nextSteps: "Practice system design for distributed systems.",
            questions: [
              { 
                question: "Explain the Node.js Event Loop.", 
                answer: "It handles asynchronous callbacks.", 
                score: 8,
                mistake: "Too brief.", 
                feedback: "Elaborate on phases like timers, poll, and check.",
                betterApproach: "Mention libuv and the specific phases of the event loop."
              }
            ]
          },
          {
            date: new Date(Date.now() - 86400000),
            targetRole: "Full Stack Developer",
            experienceLevel: "Junior",
            focus: "JavaScript and React",
            score: 84,
            overallSummary: "Strong fundamentals in React.",
            strengths: ["React Hooks"],
            areasForImprovement: ["Advanced JS concepts"],
            hiringRecommendation: "Hire for Junior level",
            nextSteps: "Review JS closures.",
            questions: [
              { 
                question: "Explain Closures", 
                answer: "Function returning function.", 
                score: 7,
                mistake: "Missed scope explanation.", 
                feedback: "Mention lexical scoping.",
                betterApproach: "A closure is the combination of a function bundled together with references to its surrounding state."
              }
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
            targetRole: "Frontend Developer",
            experienceLevel: "Mid-Level",
            focus: "React Performance",
            score: 92,
            overallSummary: "Excellent understanding of React performance optimization.",
            strengths: ["React.memo", "useMemo", "useCallback"],
            areasForImprovement: ["Webpack configuration"],
            hiringRecommendation: "Strong Hire",
            nextSteps: "Learn advanced Webpack optimization.",
            questions: [
              { 
                question: "How do you optimize a React app?", 
                answer: "I use useMemo and React.memo.", 
                score: 9,
                mistake: "None.", 
                feedback: "Good answer, could also mention code splitting.",
                betterApproach: "In addition to memoization, you can use React.lazy for code splitting."
              }
            ]
          }
        ]
      }
    ]);

    console.log("Seeding Bookings...");
    await Booking.insertMany([
      { 
        user: student1._id, 
        teacher: teacher1._id, 
        scheduledDate: new Date(Date.now() + 86400000), 
        slotId: "mock_slot_1",
        startTime: "10:00",
        endTime: "11:00",
        status: "confirmed", 
        meetingLink: "http://zoom.us/j/123",
        paymentStatus: "paid",
        amountPaid: 1500,
        razorpayOrderId: "order_mock_123"
      },
      { 
        user: student2._id, 
        teacher: teacher2._id, 
        scheduledDate: new Date(Date.now() - 86400000), 
        slotId: "mock_slot_2",
        startTime: "14:00",
        endTime: "15:00",
        status: "completed", 
        feedback: "Great session!",
        paymentStatus: "free",
        amountPaid: 0
      }
    ]);

    console.log("Seeding Reviews...");
    const review1 = await Review.create({ 
      user: student2._id, 
      teacher: teacher2._id, 
      rating: 5, 
      comment: "Neha is an excellent mentor! Very patient and knowledgeable." 
    });
    
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
