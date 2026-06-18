import { NextResponse } from "next/server";
import { connectDB, Teacher } from "@/imports";
import { getAuthUser } from "@/lib/getAuthUser";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Midnight UTC for a given date */
function toMidnightUTC(d) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/** Returns true if the date is a Saturday or Sunday */
function isWeekend(d) {
  const day = d.getUTCDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

/**
 * Generate the next N calendar dates starting from today (midnight UTC).
 */
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

/**
 * Seed missing Saturday / Sunday entries with a default 10:00–11:00 slot.
 * Mutates the teacher document (does NOT save — caller must save).
 * Returns true if any new entries were added.
 */
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

// ─── GET /api/v1/teacher/availability ────────────────────────────────────────
/**
 * Returns the calling teacher's availability for the next 20 days.
 * Auto-seeds Saturday + Sunday entries if they don't exist yet.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const teacher = await Teacher.findOne({ user: authUser.id }).populate(
      "user",
      "name email image"
    );

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    const window = nextNDates(20);

    // Seed missing weekend entries
    const dirty = seedWeekendDefaults(teacher, window);
    if (dirty) await teacher.save();

    // Return only entries that fall within the 20-day window, sorted by date
    const windowStart = window[0].getTime();
    const windowEnd = window[window.length - 1].getTime();

    const filtered = teacher.availability
      .filter((a) => {
        const t = toMidnightUTC(a.date).getTime();
        return t >= windowStart && t <= windowEnd;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return NextResponse.json(
      { teacher: teacher.toObject(), availability: filtered, window: window.map((d) => d.toISOString()) },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/v1/teacher/availability error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── PUT /api/v1/teacher/availability ────────────────────────────────────────
/**
 * Upsert a single date's availability entry.
 *
 * Body: {
 *   date: string (ISO date),
 *   isUnavailable?: boolean,
 *   slots?: [{ startTime, endTime }]   // full replacement of slots array
 * }
 */
export async function PUT(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (authUser.role !== "teacher") {
      return NextResponse.json(
        { error: "Forbidden: teachers only" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { date: dateStr, isUnavailable, slots } = body;

    if (!dateStr) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const targetDate = toMidnightUTC(new Date(dateStr));

    // Validate within 20-day window
    const today = toMidnightUTC(new Date());
    const maxDate = new Date(today);
    maxDate.setUTCDate(maxDate.getUTCDate() + 19);

    if (targetDate < today || targetDate > maxDate) {
      return NextResponse.json(
        { error: "Date must be within the next 20 days" },
        { status: 400 }
      );
    }

    const teacher = await Teacher.findOne({ user: authUser.id });
    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    // Ensure availability array exists (for legacy documents)
    if (!teacher.availability) {
      teacher.availability = [];
    }

    // Find or create the availability entry for this date
    let entry = teacher.availability.find(
      (a) => toMidnightUTC(a.date).getTime() === targetDate.getTime()
    );

    if (!entry) {
      teacher.availability.push({ date: targetDate, isUnavailable: false, slots: [] });
      entry = teacher.availability[teacher.availability.length - 1];
    }

    if (isUnavailable !== undefined) entry.isUnavailable = isUnavailable;

    if (slots !== undefined) {
      // Keep booked slots intact — only replace non-booked ones
      const bookedSlots = entry.slots.filter((s) => s.isBooked);
      const newSlots = (slots || []).map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        isBooked: false,
        bookingId: null,
      }));
      entry.slots = [...bookedSlots, ...newSlots];
    }

    await teacher.save();

    return NextResponse.json({ entry: entry.toObject() }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/v1/teacher/availability error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
