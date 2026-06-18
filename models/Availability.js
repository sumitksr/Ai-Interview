import mongoose from "mongoose";

/**
 * TimeSlot — a single bookable time window within a date entry.
 */
const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String, // e.g. "10:00"
    required: true,
  },
  endTime: {
    type: String, // e.g. "11:00"
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    default: null,
  },
});

/**
 * AvailabilityEntry — availability for a specific calendar date.
 *
 * Rules:
 *  - `date` is stored as midnight UTC of that day (no time component).
 *  - `isUnavailable = true` means the mentor has explicitly blocked this date.
 *    Students will not see any slots for blocked dates.
 *  - `slots` holds the bookable time windows for that date.
 *  - By default, every mentor has Saturday and Sunday pre-populated
 *    (seeded at Teacher creation time for the next 20 days).
 */
const availabilityEntrySchema = new mongoose.Schema({
  date: {
    type: Date, // specific calendar date — stored as midnight UTC
    required: true,
  },
  isUnavailable: {
    type: Boolean,
    default: false,
  },
  slots: {
    type: [timeSlotSchema],
    default: [],
  },
});

export { timeSlotSchema, availabilityEntrySchema };
