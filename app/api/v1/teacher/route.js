import { NextResponse } from "next/server";
import { connectDB, Teacher } from "@/imports";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toMidnightUTC(d) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function isWeekend(d) {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

function nextNDates(n = 20) {
  const dates = [];
  const base = toMidnightUTC(new Date());
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d);
  }
  return dates;
}

function seedWeekendDefaults(teacher, window) {
  let dirty = false;
  if (!teacher.availability) {
    teacher.availability = [];
    dirty = true;
  }
  for (const date of window) {
    if (!isWeekend(date)) continue;
    const exists = teacher.availability.some(
      (a) => toMidnightUTC(a.date).getTime() === date.getTime()
    );
    if (!exists) {
      teacher.availability.push({
        date,
        isUnavailable: false,
        slots: [{ startTime: "10:00", endTime: "11:00", isBooked: false }],
      });
      dirty = true;
    }
  }
  return dirty;
}

/**
 * GET /api/v1/teacher
 * Returns all teachers with their user info, bio, expertise, fees, and available slots.
 * Public endpoint — no auth required.
 */
export async function GET() {
  try {
    await connectDB();

    // Fetch as full mongoose documents to allow saving seeded defaults
    const teachersDoc = await Teacher.find({}).populate("user", "name email image");

    const window = nextNDates(20);
    const windowStart = window[0].getTime();
    const windowEnd = window[window.length - 1].getTime();

    const teachers = [];
    for (const doc of teachersDoc) {
      const dirty = seedWeekendDefaults(doc, window);
      if (dirty) await doc.save(); // Persist the seeded defaults

      // Filter to only return the next 20 days of availability
      const filteredAvail = doc.availability
        .filter((a) => {
          const t = toMidnightUTC(a.date).getTime();
          return t >= windowStart && t <= windowEnd;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const tObj = doc.toObject();
      tObj.availability = filteredAvail;
      teachers.push(tObj);
    }

    return NextResponse.json({ teachers }, { status: 200 });
  } catch (error) {
    console.error("GET /api/v1/teacher error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
