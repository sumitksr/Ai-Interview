"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMidnightUTC(d) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function get20DayWindow() {
  const dates = [];
  const base = toMidnightUTC(new Date());
  for (let i = 0; i < 20; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d);
  }
  return dates;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(d) {
  const dt = new Date(d);
  return `${DAY_NAMES[dt.getUTCDay()]}, ${dt.getUTCDate()} ${MONTH_NAMES[dt.getUTCMonth()]}`;
}

function isWeekend(d) {
  const day = new Date(d).getUTCDay();
  return day === 0 || day === 6;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <div className="tech-card rounded-2xl p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity select-none">{icon}</div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="muted-text text-xs font-bold uppercase tracking-wider">{label}</p>
        <p className="title-text text-3xl font-black mt-1">{value}</p>
      </div>
    </div>
  );
}

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  const s = {
    success: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
    error: "bg-red-500/10 border-red-500/40 text-red-400",
    info: "bg-[var(--cyan)]/10 border-[var(--cyan)]/30 text-[var(--cyan)]",
  };
  return (
    <div className={`px-4 py-3 rounded-xl border text-sm flex items-start justify-between gap-3 ${s[type]}`}>
      <span>{msg}</span>
      {onClose && <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">✕</button>}
    </div>
  );
}

function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",     label: "Overview",      icon: "📊" },
  { id: "availability", label: "Availability",  icon: "📅" },
  { id: "bookings",     label: "Bookings",      icon: "🗓️" },
  { id: "reviews",      label: "Reviews",       icon: "⭐" },
  { id: "profile",      label: "Profile",       icon: "👤" },
];

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ stats, bookings, teacher }) {
  const now = new Date();
  const upcoming = bookings
    .filter((b) => new Date(b.scheduledDate) >= now && b.status !== "cancelled" && b.status !== "completed")
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🗓️" label="Total Bookings" value={stats.totalBookings} color="bg-[var(--cyan)]/10 text-[var(--cyan)]" />
        <StatCard icon="💰" label="Total Earnings" value={`₹${stats.totalEarnings.toLocaleString()}`} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard icon="⏳" label="Upcoming" value={stats.upcomingCount} color="bg-violet-500/10 text-violet-400" />
        <StatCard icon="⭐" label="Avg Rating" value={stats.averageRating || "—"} color="bg-amber-500/10 text-amber-400" />
      </div>

      {upcoming.length > 0 && (
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6">
          <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <span>⏳</span> Upcoming Sessions
          </h3>
          <div className="space-y-3">
            {upcoming.map((b) => (
              <div key={b._id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[var(--cyan)]/10 flex items-center justify-center text-sm font-black text-[var(--cyan)] flex-shrink-0">
                    {b.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[var(--foreground)] truncate">{b.user?.name}</p>
                    <p className="text-xs text-[var(--muted)]">{formatDate(b.scheduledDate)} · {b.startTime} – {b.endTime}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Availability Tab ─────────────────────────────────────────────────────────
function AvailabilityTab() {
  const window20 = get20DayWindow();
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("10:00");

  useEffect(() => {
    fetch("/api/v1/teacher/availability")
      .then((r) => r.json())
      .then((d) => setAvailability(d.availability || []))
      .catch(() => {});
  }, []);

  function getEntry(date) {
    return availability.find(
      (a) => toMidnightUTC(new Date(a.date)).getTime() === toMidnightUTC(date).getTime()
    );
  }

  async function saveEntry(date, patch) {
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch("/api/v1/teacher/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: toMidnightUTC(date).toISOString(), ...patch }),
      });
      const data = await res.json();
      if (!res.ok) { setAlert({ type: "error", msg: data.error }); return; }
      // Update local state
      setAvailability((prev) => {
        const idx = prev.findIndex(
          (a) => toMidnightUTC(new Date(a.date)).getTime() === toMidnightUTC(date).getTime()
        );
        if (idx === -1) return [...prev, data.entry];
        const next = [...prev];
        next[idx] = data.entry;
        return next;
      });
      setAlert({ type: "success", msg: "Saved!" });
    } catch {
      setAlert({ type: "error", msg: "Failed to save. Try again." });
    } finally {
      setSaving(false);
    }
  }

  function addSlot() {
    if (!selectedDate) return;
    if (newEnd <= newStart) { setAlert({ type: "error", msg: "End time must be after start time." }); return; }
    const entry = getEntry(selectedDate);
    const existingSlots = entry?.slots?.filter(s => !s.isBooked) || [];
    const dup = existingSlots.some(s => s.startTime === newStart && s.endTime === newEnd);
    if (dup) { setAlert({ type: "error", msg: "This slot already exists." }); return; }
    const newSlots = [...existingSlots, { startTime: newStart, endTime: newEnd }];
    saveEntry(selectedDate, { slots: newSlots });
  }

  function removeSlot(slot) {
    if (!selectedDate) return;
    const entry = getEntry(selectedDate);
    const newSlots = (entry?.slots || []).filter(s => !s.isBooked && !(s.startTime === slot.startTime && s.endTime === slot.endTime));
    saveEntry(selectedDate, { slots: newSlots });
  }

  function toggleUnavailable() {
    if (!selectedDate) return;
    const entry = getEntry(selectedDate);
    saveEntry(selectedDate, { isUnavailable: !(entry?.isUnavailable) });
  }

  const selEntry = selectedDate ? getEntry(selectedDate) : null;

  return (
    <div className="space-y-6">
      {/* Date chips */}
      <div>
        <p className="text-sm font-bold text-[var(--foreground)] mb-3">Select a date to manage slots (next 20 days)</p>
        <div className="flex flex-wrap gap-2">
          {window20.map((date) => {
            const entry = getEntry(date);
            const isBlocked = entry?.isUnavailable;
            const slotCount = (entry?.slots || []).filter(s => !s.isBooked).length;
            const isSelected = selectedDate && toMidnightUTC(date).getTime() === toMidnightUTC(selectedDate).getTime();
            const weekend = isWeekend(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => { setSelectedDate(date); setAlert(null); }}
                className={`flex flex-col items-center px-3 py-2.5 rounded-xl border transition-all duration-200 min-w-[70px] ${
                  isSelected
                    ? "border-[var(--cyan)] bg-[var(--cyan)]/10 shadow-md shadow-[var(--cyan)]/10"
                    : isBlocked
                    ? "border-red-500/30 bg-red-500/5"
                    : weekend
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--cyan)]/30"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  {DAY_NAMES[date.getUTCDay()]}
                </span>
                <span className={`text-base font-black mt-0.5 ${isSelected ? "text-[var(--cyan)]" : "text-[var(--foreground)]"}`}>
                  {date.getUTCDate()}
                </span>
                <span className={`text-[9px] font-semibold mt-0.5 ${
                  isBlocked ? "text-red-400" : slotCount > 0 ? "text-emerald-400" : "text-[var(--muted)]"
                }`}>
                  {isBlocked ? "Blocked" : slotCount > 0 ? `${slotCount} slot${slotCount !== 1 ? "s" : ""}` : weekend ? "Default" : "No slots"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot management panel */}
      {selectedDate && (
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-bold text-[var(--foreground)] text-lg">{formatDate(selectedDate)}</h3>
            <button
              onClick={toggleUnavailable}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                selEntry?.isUnavailable
                  ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/15"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-red-500/30 hover:text-red-400"
              }`}
            >
              {selEntry?.isUnavailable ? "🚫 Blocked — Click to unblock" : "Block this date"}
            </button>
          </div>

          {selEntry?.isUnavailable ? (
            <div className="text-center py-8 border border-dashed border-red-500/20 rounded-2xl">
              <p className="text-red-400 font-semibold">This date is blocked for students.</p>
              <p className="muted-text text-sm mt-1">Click "Block this date" again to unblock and restore slots.</p>
            </div>
          ) : (
            <>
              {/* Existing slots */}
              <div>
                <p className="text-sm font-bold text-[var(--foreground)] mb-3">
                  Time slots ({(selEntry?.slots || []).length})
                </p>
                {(selEntry?.slots || []).length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl">
                    <p className="muted-text text-sm">No slots yet. Add one below.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(selEntry?.slots || []).map((slot, i) => (
                      <div key={i} className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border ${
                        slot.isBooked ? "border-amber-500/30 bg-amber-500/5" : "border-[var(--border)] bg-[var(--surface-2)]"
                      }`}>
                        <div>
                          <p className="font-bold text-sm text-[var(--foreground)]">{slot.startTime} – {slot.endTime}</p>
                          {slot.isBooked && <p className="text-xs text-amber-400 font-semibold mt-0.5">Booked</p>}
                        </div>
                        {!slot.isBooked && (
                          <button
                            onClick={() => removeSlot(slot)}
                            className="w-7 h-7 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add slot */}
              <div className="bg-[var(--surface-2)] rounded-2xl p-4 border border-[var(--border)] space-y-3">
                <p className="text-sm font-bold text-[var(--foreground)]">Add a slot</p>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="block">
                    <span className="text-xs text-[var(--muted)] font-semibold">Start</span>
                    <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="input-control mt-1 w-32" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-[var(--muted)] font-semibold">End</span>
                    <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="input-control mt-1 w-32" />
                  </label>
                  <button
                    onClick={addSlot}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 text-[var(--cyan)] hover:bg-[var(--cyan)]/15 transition-colors disabled:opacity-50"
                  >
                    {saving ? <span className="w-4 h-4 border-2 border-[var(--cyan)]/40 border-t-[var(--cyan)] rounded-full animate-spin"/> : "+ Add"}
                  </button>
                </div>
              </div>

              <Alert type={alert?.type} msg={alert?.msg} onClose={() => setAlert(null)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────────
function BookingsTab({ bookings, onReschedule }) {
  const [view, setView] = useState("upcoming");
  const [rescheduleBooking, setRescheduleBooking] = useState(null); // booking being rescheduled
  const [newDate, setNewDate] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const now = new Date();

  const upcoming = bookings.filter(
    b => new Date(b.scheduledDate) >= now && b.status !== "cancelled" && b.status !== "completed"
  ).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  const past = bookings.filter(
    b => new Date(b.scheduledDate) < now || b.status === "completed" || b.status === "cancelled"
  ).sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));

  const list = view === "upcoming" ? upcoming : past;

  function openReschedule(b) {
    setRescheduleBooking(b);
    setNewDate(b.scheduledDate ? new Date(b.scheduledDate).toISOString().split("T")[0] : "");
    setNewStart(b.startTime || "");
    setNewEnd(b.endTime || "");
    setAlert(null);
  }

  async function handleReschedule(e) {
    e.preventDefault();
    if (!newStart || !newEnd) { setAlert({ type: "error", msg: "Please fill in both times." }); return; }
    if (newStart >= newEnd) { setAlert({ type: "error", msg: "End time must be after start time." }); return; }
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch("/api/v1/teacher/book/reschedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: rescheduleBooking._id,
          newDate: newDate,
          newStartTime: newStart,
          newEndTime: newEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAlert({ type: "error", msg: data.error || "Failed to reschedule." }); return; }
      // Propagate update to parent so dashboard state stays in sync
      onReschedule(rescheduleBooking._id, newDate, newStart, newEnd);
      setAlert({ type: "success", msg: "Meeting time updated! Student has been notified by email. ✉️" });
      setTimeout(() => setRescheduleBooking(null), 2000);
    } catch {
      setAlert({ type: "error", msg: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {["upcoming", "past"].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              view === v ? "border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--cyan)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--cyan)]/30"
            }`}>
            {v.charAt(0).toUpperCase() + v.slice(1)} ({v === "upcoming" ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl">
          <p className="muted-text font-semibold">No {view} sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(b => {
            const statusCls = {
              confirmed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
              completed: "text-[var(--muted)] bg-[var(--surface-2)] border-[var(--border)]",
            }[b.status] || "";

            const canReschedule = b.status === "confirmed" || b.status === "pending";

            return (
              <div key={b._id} className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-sm font-black text-[var(--accent)] flex-shrink-0">
                    {b.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[var(--foreground)] truncate">{b.user?.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatDate(b.scheduledDate)}
                      {b.startTime && ` · ${b.startTime} – ${b.endTime}`}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{b.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {view === "upcoming" && canReschedule && (
                    <button
                      onClick={() => openReschedule(b)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Reschedule
                    </button>
                  )}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border capitalize ${statusCls}`}>{b.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reschedule Modal ── */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0a0f1c] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-7 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-black text-xl text-white">Reschedule Meeting</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Student: <span className="text-white font-semibold">{rescheduleBooking.user?.name}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(rescheduleBooking.scheduledDate)}</p>
              </div>
              <button
                onClick={() => setRescheduleBooking(null)}
                className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            {/* Current time */}
            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm">
              <span className="text-gray-500">Current time: </span>
              <span className="text-gray-300 font-semibold line-through">{rescheduleBooking.startTime} – {rescheduleBooking.endTime}</span>
            </div>

            <form onSubmit={handleReschedule} className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Date</span>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  required
                  className="input-control mt-2 w-full"
                />
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Start Time</span>
                  <input
                    type="time"
                    value={newStart}
                    onChange={e => setNewStart(e.target.value)}
                    required
                    className="input-control mt-2 w-full"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">New End Time</span>
                  <input
                    type="time"
                    value={newEnd}
                    onChange={e => setNewEnd(e.target.value)}
                    required
                    className="input-control mt-2 w-full"
                  />
                </label>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                </svg>
                <span>Student will receive an email notification with the updated time. Meeting link opens 30 min before start and expires 1 hr after end.</span>
              </div>

              {alert && (
                <div className={`px-4 py-3 rounded-xl border text-sm ${
                  alert.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                  {alert.msg}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRescheduleBooking(null)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-sm font-bold text-[#0a0500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                      Updating…
                    </span>
                  ) : "Update & Notify Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reviews Tab ──────────────────────────────────────────────────────────────
function ReviewsTab({ reviews, stats }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="text-center">
          <p className="text-6xl font-black text-amber-400">{stats.averageRating || "—"}</p>
          <StarRating rating={stats.averageRating} size={20} />
          <p className="muted-text text-sm mt-2">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 w-full">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => Math.round(r.rating) === star).length;
            const pct = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-[var(--muted)] w-4">{star}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-[var(--muted)] w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl">
          <p className="text-4xl mb-3">⭐</p>
          <p className="font-semibold text-[var(--foreground)]">No reviews yet</p>
          <p className="muted-text text-sm mt-1">Students will leave reviews after completed sessions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r._id} className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-sm font-black text-[var(--accent)] flex-shrink-0">
                  {r.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--foreground)]">{r.user?.name || "Anonymous"}</p>
                  <p className="text-xs text-[var(--muted)]">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <StarRating rating={r.rating} size={14} />
              </div>
              {r.comment && <p className="muted-text text-sm leading-relaxed italic">"{r.comment}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ teacher, onUpdate }) {
  const [bio, setBio] = useState(teacher?.bio || "");
  const [expertiseInput, setExpertiseInput] = useState("");
  const [expertise, setExpertise] = useState(teacher?.expertise || []);
  const [fees, setFees] = useState(teacher?.fees ?? 0);
  
  // Work Experiences State
  const [workExperiences, setWorkExperiences] = useState(teacher?.workExperiences || []);
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [newExp, setNewExp] = useState({ position: "", company: "", startDate: "", endDate: "", isCurrent: false, description: "" });

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  function addTag() {
    const t = expertiseInput.trim();
    if (!t || expertise.includes(t)) return;
    setExpertise(prev => [...prev, t]);
    setExpertiseInput("");
  }

  function removeTag(tag) {
    setExpertise(prev => prev.filter(t => t !== tag));
  }

  function handleTagKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
  }

  function handleAddExperience() {
    if (!newExp.position || !newExp.company || !newExp.startDate) {
      setAlert({ type: "error", msg: "Position, Company, and Start Date are required." });
      return;
    }
    setWorkExperiences(prev => [...prev, newExp]);
    setNewExp({ position: "", company: "", startDate: "", endDate: "", isCurrent: false, description: "" });
    setIsAddingExp(false);
    setAlert(null);
  }

  function removeExperience(index) {
    setWorkExperiences(prev => prev.filter((_, i) => i !== index));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch("/api/v1/teacher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, expertise, workExperiences, fees }),
      });
      const data = await res.json();
      if (!res.ok) { setAlert({ type: "error", msg: data.error }); return; }
      setAlert({ type: "success", msg: "Profile updated successfully!" });
      onUpdate(data.teacher);
    } catch {
      setAlert({ type: "error", msg: "Failed to update. Try again." });
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={save} className="space-y-6">
        
        {/* Basic Profile */}
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 space-y-5">
          <h3 className="font-bold text-[var(--foreground)]">Public Profile</h3>

          <label className="block">
            <span className="soft-text text-sm font-semibold">Session Price (₹)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={fees}
              onChange={e => setFees(Number(e.target.value))}
              className="input-control mt-2 w-full sm:max-w-[200px]"
              placeholder="e.g. 500"
            />
            <p className="muted-text text-xs mt-1">Charged per 1-on-1 session.</p>
          </label>

          <label className="block">
            <span className="soft-text text-sm font-semibold">Bio</span>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              placeholder="Tell students about your background and what you can help with…"
              className="input-control mt-2 w-full resize-none"
            />
          </label>

          <div>
            <span className="soft-text text-sm font-semibold">Expertise & Skills</span>
            <div className="flex flex-wrap gap-2 mt-2 mb-2 min-h-[2.5rem] p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              {expertise.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 text-[var(--cyan)]">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="opacity-60 hover:opacity-100 transition-opacity">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={expertiseInput}
                onChange={e => setExpertiseInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="e.g. React, System Design (Enter to add)"
                className="input-control flex-1 text-sm"
              />
              <button type="button" onClick={addTag} className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 text-[var(--cyan)] hover:bg-[var(--cyan)]/15 transition-colors">Add</button>
            </div>
          </div>
        </div>

        {/* Experience Section */}
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[var(--foreground)]">Work Experience</h3>
            <button 
              type="button" 
              onClick={() => setIsAddingExp(true)} 
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--cyan)]/30 text-[var(--cyan)] hover:bg-[var(--cyan)]/10 transition-colors"
            >
              + Add Experience
            </button>
          </div>

          {/* List existing experiences */}
          {workExperiences.length > 0 ? (
            <div className="space-y-3">
              {workExperiences.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] relative group">
                  <button 
                    type="button" 
                    onClick={() => removeExperience(idx)}
                    className="absolute top-4 right-4 w-6 h-6 rounded-md bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <p className="font-bold text-sm text-[var(--foreground)] pr-6">{exp.position}</p>
                  <p className="text-xs text-[var(--cyan)] font-semibold mt-0.5">{exp.company}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                  </p>
                  {exp.description && <p className="text-xs text-[var(--soft-text)] mt-2 leading-relaxed">{exp.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-2xl">
              <p className="text-sm text-[var(--muted)]">No experience added yet.</p>
            </div>
          )}

          {/* Add Form */}
          {isAddingExp && (
            <div className="p-4 rounded-xl border border-[var(--cyan)]/30 bg-[var(--cyan)]/5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-[var(--muted)]">Title / Position *</span>
                  <input type="text" value={newExp.position} onChange={e => setNewExp({...newExp, position: e.target.value})} className="input-control mt-1 text-sm py-2" placeholder="e.g. Senior Engineer" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-[var(--muted)]">Company *</span>
                  <input type="text" value={newExp.company} onChange={e => setNewExp({...newExp, company: e.target.value})} className="input-control mt-1 text-sm py-2" placeholder="e.g. Google" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-[var(--muted)]">Start Date *</span>
                  <input type="month" value={newExp.startDate} onChange={e => setNewExp({...newExp, startDate: e.target.value})} className="input-control mt-1 text-sm py-2" />
                </label>
                <div className="block">
                  <span className="text-xs font-semibold text-[var(--muted)]">End Date</span>
                  {newExp.isCurrent ? (
                    <div className="mt-1 h-[38px] flex items-center px-3 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] text-sm border border-[var(--border)]">Present</div>
                  ) : (
                    <input type="month" value={newExp.endDate} onChange={e => setNewExp({...newExp, endDate: e.target.value})} className="input-control mt-1 text-sm py-2" />
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input type="checkbox" checked={newExp.isCurrent} onChange={e => setNewExp({...newExp, isCurrent: e.target.checked, endDate: ""})} className="w-4 h-4 rounded border-[var(--border)] bg-[var(--surface-2)] text-[var(--cyan)] focus:ring-[var(--cyan)]" />
                <span className="text-sm font-semibold text-[var(--foreground)]">I currently work here</span>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-[var(--muted)]">Description (optional)</span>
                <textarea rows={2} value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})} className="input-control mt-1 text-sm py-2 resize-none" placeholder="What did you do?" />
              </label>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsAddingExp(false)} className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]">Cancel</button>
                <button type="button" onClick={handleAddExperience} className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)]/10 text-[var(--cyan)] border border-[var(--cyan)]/20 hover:bg-[var(--cyan)]/20">Add Role</button>
              </div>
            </div>
          )}
        </div>

        <Alert type={alert?.type} msg={alert?.msg} onClose={() => setAlert(null)} />
        <button type="submit" disabled={saving} className="btn-primary px-8 rounded-xl disabled:opacity-50">
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

// ─── Main Mentor Dashboard ────────────────────────────────────────────────────
export default function MentorDashboard() {
  const { isLoggedIn, userInfo } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { router.push("/login"); return; }

    fetch("/api/v1/teacher/dashboard")
      .then(r => {
        if (r.status === 403) { router.push("/dashboard"); throw new Error("not a teacher"); }
        if (r.status === 401) { router.push("/login"); throw new Error("unauthorized"); }
        return r.json();
      })
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, router]);

  const handleTeacherUpdate = useCallback((updatedTeacher) => {
    setData(prev => prev ? { ...prev, teacher: updatedTeacher } : prev);
  }, []);

  const handleReschedule = useCallback((bookingId, newDate, newStartTime, newEndTime) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        bookings: prev.bookings.map(b =>
          b._id === bookingId ? { ...b, scheduledDate: new Date(newDate), startTime: newStartTime, endTime: newEndTime } : b
        ),
      };
    });
  }, []);

  if (loading) return (
    <div className="page-shell flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-[var(--cyan)]/15" />
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-[var(--surface-2)] border-t-[var(--cyan)]" />
      </div>
      <p className="text-[var(--muted)] animate-pulse font-medium">Loading your dashboard…</p>
    </div>
  );

  if (!data) return null;

  const { teacher, bookings, reviews, stats } = data;

  return (
    <div className="page-shell mx-auto max-w-7xl px-5 py-10 sm:px-8 relative">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--cyan)]/4 rounded-full blur-[160px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--accent)]/4 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 mb-3">
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--cyan)]">Mentor Portal</p>
          </div>
          <h1 className="title-text text-4xl sm:text-5xl font-black tracking-tight">Mentor Dashboard</h1>
          <p className="muted-text mt-2">
            Welcome back, <span className="text-[var(--foreground)] font-semibold">{teacher?.user?.name}</span>
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all duration-200 ${
              activeTab === tab.id
                ? "border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--cyan)] shadow-md shadow-[var(--cyan)]/10"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] hover:border-[var(--border)]"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "overview"     && <OverviewTab stats={stats} bookings={bookings} teacher={teacher} />}
        {activeTab === "availability" && <AvailabilityTab />}
        {activeTab === "bookings"     && <BookingsTab bookings={bookings} onReschedule={handleReschedule} />}
        {activeTab === "reviews"      && <ReviewsTab reviews={reviews} stats={stats} />}
        {activeTab === "profile"      && <ProfileTab teacher={teacher} onUpdate={handleTeacherUpdate} />}
      </div>
    </div>
  );
}
