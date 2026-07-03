import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectDB, User } from "@/imports";
import Booking from "@/models/Booking";
import mongoose from "mongoose";

function parseTime(str = "") {
  const [h, m] = str.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

/**
 * Build a Date from a scheduledDate + "HH:MM" string.
 * scheduledDate is stored at midnight UTC.
 * We assume timeStr is in IST (Asia/Kolkata).
 */
function buildDateTime(scheduledDate, timeStr) {
  const { h, m } = parseTime(timeStr);
  const dateObj = new Date(scheduledDate);
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");

  // Construct an ISO string for IST (+05:30)
  return new Date(`${year}-${month}-${day}T${hh}:${mm}:00+05:30`);
}

export default async function MeetPage({ params }) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/login?callbackUrl=/meet/" + (await params).id);
  }

  const { id } = await params;
  await connectDB();

  const query = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { bookid: id }] }
    : { bookid: id };

  const booking = await Booking.findOne(query).populate("teacher");

  // ── Not Found ──────────────────────────────────────────────────────────────
  if (!booking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070d] text-white">
        <div className="text-center p-10 max-w-md bg-[#0a0f1c] rounded-3xl shadow-2xl ring-1 ring-white/10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 text-3xl">
            🔍
          </div>
          <h1 className="text-2xl font-black text-red-400 mb-2">Meeting Not Found</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            This session link may be invalid or expired.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ── Authorization ──────────────────────────────────────────────────────────
  const userId = authUser.id;
  const isStudent = booking.user.toString() === userId;
  const isMentor = booking.teacher && booking.teacher.user.toString() === userId;

  if (!isStudent && !isMentor) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070d] text-white">
        <div className="text-center p-10 max-w-md bg-[#0a0f1c] rounded-3xl shadow-2xl ring-1 ring-white/10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 text-3xl">
            🚫
          </div>
          <h1 className="text-2xl font-black text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            You don&apos;t have permission to join this meeting.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ── Status Check ───────────────────────────────────────────────────────────
  if (booking.status === "cancelled") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070d] text-white">
        <div className="text-center p-10 max-w-md bg-[#0a0f1c] rounded-3xl shadow-2xl ring-1 ring-white/10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 text-3xl">
            ❌
          </div>
          <h1 className="text-2xl font-black text-red-400 mb-2">Session Cancelled</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            This interview session has been cancelled and is no longer accessible.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (booking.status === "completed") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070d] text-white">
        <div className="text-center p-10 max-w-md bg-[#0a0f1c] rounded-3xl shadow-2xl ring-1 ring-white/10">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-5 text-3xl">
            ✅
          </div>
          <h1 className="text-2xl font-black text-teal-400 mb-2">Session Completed</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            This interview session has already been completed.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-semibold text-sm hover:bg-teal-500/15 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ── Time-window enforcement ────────────────────────────────────────────────
  // Window: (startTime - 30 min) → (endTime + 60 min)
  if (booking.scheduledDate && booking.startTime && booking.endTime) {
    const now = new Date();
    const meetStart = buildDateTime(booking.scheduledDate, booking.startTime);
    const meetEnd   = buildDateTime(booking.scheduledDate, booking.endTime);

    const openAt   = new Date(meetStart.getTime() - 30 * 60 * 1000);  // 30 min before
    const expireAt = new Date(meetEnd.getTime()   + 60 * 60 * 1000);  // 1 hr after end

    const formattedDate = new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata",
    });

    if (now < openAt) {
      // Too early
      return (
        <div className="flex h-screen items-center justify-center bg-[#05070d] text-white">
          <div className="text-center p-10 max-w-md bg-[#0a0f1c] rounded-3xl shadow-2xl ring-1 ring-white/10">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 text-3xl">
              ⏳
            </div>
            <h1 className="text-2xl font-black text-amber-400 mb-2">Meeting Hasn&apos;t Started Yet</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              The Google Meet link becomes active{" "}
              <strong className="text-white">30 minutes before</strong> the scheduled start time.
            </p>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-1 text-sm mb-6">
              <p className="text-gray-400">{formattedDate}</p>
              <p className="text-white font-bold text-lg">{booking.startTime} – {booking.endTime}</p>
              <p className="text-teal-400 text-xs">
                Link activates at{" "}
                {openAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
              </p>
            </div>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-semibold text-sm hover:bg-teal-500/15 transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      );
    }

    if (now > expireAt) {
      // Expired
      return (
        <div className="flex h-screen items-center justify-center bg-[#05070d] text-white">
          <div className="text-center p-10 max-w-md bg-[#0a0f1c] rounded-3xl shadow-2xl ring-1 ring-white/10">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 text-3xl">
              🔒
            </div>
            <h1 className="text-2xl font-black text-red-400 mb-2">Meeting Link Expired</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              This link was available until{" "}
              <strong className="text-white">1 hour after</strong> the session ended. The link is no longer active.
            </p>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-1 text-sm mb-6">
              <p className="text-gray-400">{formattedDate}</p>
              <p className="text-white font-bold text-lg">{booking.startTime} – {booking.endTime}</p>
              <p className="text-red-400 text-xs">
                Link expired at{" "}
                {expireAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
              </p>
            </div>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  // ── Meet Link Check ────────────────────────────────────────────────────────
  if (!booking.meetingLink) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070d] text-white">
        <div className="text-center p-10 max-w-md bg-[#0a0f1c] rounded-3xl shadow-2xl ring-1 ring-white/10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 text-3xl">
            🔗
          </div>
          <h1 className="text-2xl font-black text-amber-400 mb-2">Meet Link Not Ready</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            The Google Meet link for this session is not yet available. Please contact{" "}
            <a
              href="mailto:sumitksr4156@gmail.com"
              className="text-teal-400 underline"
            >
              support
            </a>{" "}
            if this persists.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ── All checks passed — redirect to Google Meet ────────────────────────────
  // The meetingLink is read server-side and never sent to the browser.
  redirect(booking.meetingLink);
}
