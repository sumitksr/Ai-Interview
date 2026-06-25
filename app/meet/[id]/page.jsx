import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectDB, User } from "@/imports";
import Booking from "@/models/Booking";
import mongoose from "mongoose";
import MeetingRoom from "./MeetingRoom";

export default async function MeetPage({ params }) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    redirect("/login");
  }

  const { id } = await params; // Next.js 15+ sometimes requires params to be awaited
  await connectDB();

  const query = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { bookid: id }] }
    : { bookid: id };

  const booking = await Booking.findOne(query).populate("teacher");

  if (!booking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <h1 className="text-2xl font-bold text-red-400">Meeting not found</h1>
      </div>
    );
  }

  const userId = authUser.id;
  const userDoc = await User.findById(userId).select("name");
  const userName = userDoc?.name || "Participant";
  const isStudent = booking.user.toString() === userId;
  const isMentor = booking.teacher && booking.teacher.user.toString() === userId;

  if (!isStudent && !isMentor) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center p-8 bg-gray-900 rounded-2xl shadow-xl ring-1 ring-gray-800">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to join this meeting.</p>
        </div>
      </div>
    );
  }

  return (
    <MeetingRoom 
      roomId={booking._id.toString()} 
      userId={userId} 
      userName={userName} 
    />
  );
}
