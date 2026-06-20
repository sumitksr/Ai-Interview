"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Script from "next/script";

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

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(d) {
  const dt = new Date(d);
  return `${DAY_SHORT[dt.getUTCDay()]}, ${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]}`;
}

// ─── Avatar helper ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#d32f2f","#ef9a9a"],["#1565c0","#90caf9"],["#2e7d32","#a5d6a7"],
  ["#e65100","#ffcc80"],["#6a1b9a","#ce93d8"],["#00695c","#80cbc4"],
  ["#ad1457","#f48fb1"],["#0277bd","#81d4fa"],["#558b2f","#c5e1a5"],
  ["#4527a0","#b39ddb"],
];
function getAvatarStyle(name) {
  if (!name) return { background: "#1565c0", color: "#90caf9" };
  const [bg, text] = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return { background: bg, color: text };
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const s = {
    success: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
    error:   "bg-red-500/15 border-red-500/40 text-red-400",
    info:    "bg-[var(--cyan)]/10 border-[var(--cyan)]/30 text-[var(--cyan)]",
  };
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl max-w-sm ${s[toast.type]}`}>
      <span className="text-lg leading-none mt-0.5">
        {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
      </span>
      <span className="text-sm font-semibold leading-relaxed flex-1">{toast.message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity text-lg leading-none">✕</button>
    </div>
  );
}

// ─── 2-Step Booking Modal ─────────────────────────────────────────────────────
function BookingModal({ teacher, onClose, onBooked }) {
  const window20 = get20DayWindow();

  // Step 1: pick date. Step 2: pick slot.
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);

  // Build a map: date ISO string → availability entry
  const availMap = {};
  for (const entry of teacher.availability || []) {
    const key = toMidnightUTC(new Date(entry.date)).toISOString();
    availMap[key] = entry;
  }

  // Dates that have at least 1 free slot (within 20 days)
  const datesWithSlots = window20.filter(date => {
    const entry = availMap[toMidnightUTC(date).toISOString()];
    if (!entry || entry.isUnavailable) return false;
    return (entry.slots || []).some(s => !s.isBooked);
  });

  const selEntry = selectedDate
    ? availMap[toMidnightUTC(selectedDate).toISOString()]
    : null;

  const freeSlots = (selEntry?.slots || []).filter(s => !s.isBooked);

  async function handleBook() {
    if (!selectedDate || !selectedSlot) return;
    setBooking(true);
    try {
      // 1. Create a Razorpay order
      const orderRes = await fetch("/api/v1/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: teacher._id }),
      });
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Initialize Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AI Interview",
        description: `Booking with ${orderData.teacherName}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          // 3. Verify and confirm booking
          try {
            const verifyRes = await fetch("/api/v1/teacher/book", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                teacherId: teacher._id,
                date: toMidnightUTC(selectedDate).toISOString(),
                slotId: selectedSlot._id,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const data = await verifyRes.json();
            onBooked(verifyRes.ok ? { type: "success", message: data.message } : { type: "error", message: data.error || "Booking failed." });
          } catch (error) {
            onBooked({ type: "error", message: "Verification failed. Please contact support." });
          } finally {
            setBooking(false);
            onClose();
          }
        },
        theme: {
          color: "#00e5ff", // matches cyan
        },
        modal: {
          ondismiss: function () {
            setBooking(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        setBooking(false);
        onBooked({ type: "error", message: "Payment failed. Please try again." });
      });
      rzp.open();
    } catch (error) {
      setBooking(false);
      onBooked({ type: "error", message: error.message || "Network error. Please try again." });
    }
  }

  const avatarStyle = getAvatarStyle(teacher.user?.name);
  const totalAvailable = datesWithSlots.reduce((acc, date) => {
    const entry = availMap[toMidnightUTC(date).toISOString()];
    return acc + (entry?.slots || []).filter(s => !s.isBooked).length;
  }, 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden">
        {/* Top glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[var(--cyan)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-[var(--border)] bg-[var(--surface-2)]/50">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 overflow-hidden ring-2 ring-white/10"
            style={teacher.user?.image ? {} : avatarStyle}
          >
            {teacher.user?.image
              ? <img src={teacher.user.image} alt={teacher.user?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : <span style={{ color: avatarStyle.color }}>{teacher.user?.name?.charAt(0)?.toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="title-text font-black text-xl truncate">{teacher.user?.name}</h2>
            {teacher.bio && <p className="muted-text text-sm mt-0.5 line-clamp-1">{teacher.bio}</p>}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[var(--cyan)] font-black text-lg">₹{teacher.fees}</span>
              <span className="muted-text text-xs">/ session</span>
              <span className="text-xs font-semibold text-emerald-400 ml-1">· {totalAvailable} slot{totalAvailable !== 1 ? "s" : ""} open</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-1">
          {[1, 2].map(s => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${step >= s ? "text-[var(--cyan)]" : "text-[var(--muted)]"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${step >= s ? "border-[var(--cyan)] bg-[var(--cyan)]/15" : "border-[var(--border)] bg-transparent"}`}>{s}</div>
                <span className="text-xs font-semibold hidden sm:inline">{s === 1 ? "Pick a date" : "Pick a time"}</span>
              </div>
              {s < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step >= 2 ? "bg-[var(--cyan)]" : "bg-[var(--border)]"}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 — Date picker */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <p className="text-sm font-bold text-[var(--foreground)]">Choose an available date</p>
            {datesWithSlots.length === 0 ? (
              <div className="text-center py-10 text-[var(--muted)]">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p className="font-semibold">No available dates right now</p>
                <p className="text-xs mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {datesWithSlots.map(date => {
                  const entry = availMap[toMidnightUTC(date).toISOString()];
                  const freeCount = (entry?.slots || []).filter(s => !s.isBooked).length;
                  const isSel = selectedDate && toMidnightUTC(date).getTime() === toMidnightUTC(selectedDate).getTime();
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                        isSel ? "border-[var(--cyan)] bg-[var(--cyan)]/10 shadow-md shadow-[var(--cyan)]/10" : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--cyan)]/40"
                      }`}
                    >
                      <p className={`font-black text-sm ${isSel ? "text-[var(--cyan)]" : "text-[var(--foreground)]"}`}>{fmtDate(date)}</p>
                      <p className="text-xs text-emerald-400 font-semibold mt-0.5">{freeCount} slot{freeCount !== 1 ? "s" : ""} open</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Slot picker */}
        {step === 2 && selectedDate && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => { setStep(1); setSelectedSlot(null); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <p className="text-sm font-bold text-[var(--foreground)]">{fmtDate(selectedDate)} — pick a time</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {freeSlots.map((slot, idx) => {
                const isSel = selectedSlot?._id ? selectedSlot._id === slot._id : selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime;
                const slotKey = slot._id || `${slot.startTime}-${slot.endTime}-${idx}`;
                return (
                  <button key={slotKey} onClick={() => setSelectedSlot(slot)}
                    className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                      isSel ? "border-[var(--cyan)] bg-[var(--cyan)]/10 shadow-md shadow-[var(--cyan)]/10" : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--cyan)]/40"
                    }`}
                  >
                    <p className={`font-black text-sm ${isSel ? "text-[var(--cyan)]" : "text-[var(--foreground)]"}`}>{slot.startTime} – {slot.endTime}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] text-sm font-semibold hover:bg-[var(--surface-2)] transition-colors">
            Cancel
          </button>
          {step === 1 ? (
            <button
              onClick={() => { if (selectedDate) setStep(2); }}
              disabled={!selectedDate}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: selectedDate ? "linear-gradient(135deg, var(--cyan), var(--accent))" : "var(--surface-2)", color: selectedDate ? "white" : "var(--muted)" }}
            >
              Next: Pick Time →
            </button>
          ) : (
            <button
              onClick={handleBook}
              disabled={!selectedSlot || booking}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: selectedSlot ? "linear-gradient(135deg, var(--cyan), var(--accent))" : "var(--surface-2)", color: selectedSlot ? "white" : "var(--muted)" }}
            >
              {booking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Booking…
                </span>
              ) : "Confirm Booking →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Teacher Card ─────────────────────────────────────────────────────────────
function TeacherCard({ teacher, onBook }) {
  const window20 = get20DayWindow();
  const availMap = {};
  for (const entry of teacher.availability || []) {
    const key = toMidnightUTC(new Date(entry.date)).toISOString();
    availMap[key] = entry;
  }
  const totalAvailable = window20.reduce((acc, date) => {
    const entry = availMap[toMidnightUTC(date).toISOString()];
    if (!entry || entry.isUnavailable) return acc;
    return acc + (entry.slots || []).filter(s => !s.isBooked).length;
  }, 0);

  const avatarStyle = getAvatarStyle(teacher.user?.name);

  return (
    <div className="tech-card rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="h-1 w-full bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)]" />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 overflow-hidden ring-2 ring-white/10 shadow-lg"
            style={teacher.user?.image ? {} : avatarStyle}
          >
            {teacher.user?.image
              ? <img src={teacher.user.image} alt={teacher.user?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : <span style={{ color: avatarStyle.color }}>{teacher.user?.name?.charAt(0)?.toUpperCase()}</span>
            }
          </div>
          <div className="min-w-0">
            <h3 className="title-text font-black text-lg leading-tight truncate">{teacher.user?.name}</h3>
            <p className="muted-text text-xs mt-0.5 truncate">{teacher.username}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${totalAvailable > 0 ? "bg-emerald-400 animate-pulse" : "bg-[var(--muted)]"}`} />
              <span className={`text-xs font-semibold ${totalAvailable > 0 ? "text-emerald-400" : "text-[var(--muted)]"}`}>
                {totalAvailable > 0 ? `${totalAvailable} slot${totalAvailable !== 1 ? "s" : ""} in next 20 days` : "No slots available"}
              </span>
            </div>
          </div>
        </div>

        {teacher.bio && <p className="muted-text text-sm leading-relaxed mb-4 line-clamp-3 flex-1">{teacher.bio}</p>}

        {teacher.expertise?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {teacher.expertise.slice(0, 4).map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--cyan)]/20 bg-[var(--cyan)]/5 text-[var(--cyan)]">{tag}</span>
            ))}
            {teacher.expertise.length > 4 && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--border)] bg-[var(--surface-2)] muted-text">+{teacher.expertise.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)]">
          <div>
            <span className="text-2xl font-black text-[var(--cyan)]">₹{teacher.fees}</span>
            <span className="muted-text text-xs ml-1">/ session</span>
          </div>
          <button
            onClick={() => onBook(teacher)}
            disabled={totalAvailable === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
            style={{
              background: totalAvailable > 0 ? "linear-gradient(135deg, var(--cyan), var(--accent))" : "var(--surface-2)",
              color: totalAvailable > 0 ? "white" : "var(--muted)",
            }}
          >
            {totalAvailable > 0 ? "Book Session" : "Fully Booked"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Mentors Page ────────────────────────────────────────────────────────
export default function MentorsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch("/api/v1/teacher")
      .then(r => r.json())
      .then(d => setTeachers(d.teachers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBook = useCallback((teacher) => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setSelectedTeacher(teacher);
  }, [isLoggedIn, router]);

  const handleBooked = useCallback((toastData) => {
    setToast(toastData);
    // Re-fetch to get updated slot availability
    fetch("/api/v1/teacher").then(r => r.json()).then(d => setTeachers(d.teachers || [])).catch(() => {});
  }, []);

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase();
    return (
      t.user?.name?.toLowerCase().includes(q) ||
      t.bio?.toLowerCase().includes(q) ||
      t.expertise?.some(e => e.toLowerCase().includes(q)) ||
      t.username?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="page-shell mx-auto max-w-7xl px-5 py-12 sm:px-8 relative min-h-[80vh]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--cyan)]/4 rounded-full blur-[160px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--accent)]/4 rounded-full blur-[140px] -z-10 pointer-events-none" />

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--cyan)]">Expert Guidance</p>
          </div>
          <h1 className="title-text text-4xl sm:text-5xl font-black tracking-tight mb-3">Find a Mentor</h1>
          <p className="muted-text text-base max-w-xl mx-auto leading-relaxed">
            Book a one-on-one session with an experienced mentor. Sessions available within the next 20 days.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-lg mx-auto mb-10 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <input id="mentor-search" type="text" placeholder="Search by name, expertise, or topic…" value={search} onChange={e => setSearch(e.target.value)} className="input-control pl-11 w-full" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-[var(--cyan)]/15" />
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--surface-2)] border-t-[var(--cyan)]" />
            </div>
            <p className="muted-text animate-pulse text-sm">Loading mentors…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && teachers.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h2 className="title-text text-2xl font-black mb-2">No mentors yet</h2>
            <p className="muted-text text-sm">Mentors will appear here once they set up their profiles.</p>
          </div>
        )}

        {/* No search results */}
        {!loading && teachers.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="title-text text-lg font-bold">No results for "{search}"</p>
            <p className="muted-text text-sm mt-2">Try a different keyword or clear the search.</p>
            <button onClick={() => setSearch("")} className="mt-4 btn-secondary text-sm rounded-xl px-5 py-2.5">Clear search</button>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <>
            <p className="muted-text text-sm mb-5">{filtered.length} mentor{filtered.length !== 1 ? "s" : ""} available</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(teacher => <TeacherCard key={teacher._id} teacher={teacher} onBook={handleBook} />)}
            </div>
          </>
        )}
      </div>

      {selectedTeacher && (
        <BookingModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} onBooked={handleBooked} />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
