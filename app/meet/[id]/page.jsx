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

  const { id } = await params;
  await connectDB();

  const query = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { bookid: id }] }
    : { bookid: id };

  const booking = await Booking.findOne(query).populate("teacher");

  if (!booking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center p-8 bg-gray-900 rounded-2xl shadow-xl ring-1 ring-gray-800">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Meeting Not Found</h1>
          <p className="text-gray-400">This session link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const userId = authUser.id;
  const userDoc = await User.findById(userId).select("name");
  const userName = userDoc?.name || "Participant";

  const isStudent = booking.user.toString() === userId;
  const isMentor =
    booking.teacher && booking.teacher.user.toString() === userId;

  if (!isStudent && !isMentor) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center p-8 bg-gray-900 rounded-2xl shadow-xl ring-1 ring-gray-800">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-400">You don&apos;t have permission to join this meeting.</p>
        </div>
      </div>
    );
  }

  const bookingInfo = {
    scheduledDate: booking.scheduledDate?.toISOString() || null,
    startTime: booking.startTime || "",
    endTime: booking.endTime || "",
    bookid: booking.bookid || "",
  };

  return (
    <MeetingRoom
      roomId={booking._id.toString()}
      userId={userId}
      userName={userName}
      role={isMentor ? "mentor" : "student"}
      bookingInfo={bookingInfo}
    />
  );
}
