"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { useAuth } from "@/context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function toMidnightUTC(d) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}
function fmtMonth(str) {
  if (!str) return "";
  const [y, m] = str.split("-");
  return `${MONTH_FULL[parseInt(m, 10) - 1]} ${y}`;
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

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast, onClose, onResend, cooldown }) {
  // Regular toasts auto-dismiss; verify toasts stay until closed
  useEffect(() => {
    if (!toast || toast.type === "warn") return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  if (toast.type === "warn") {
    // ─ Amber email-verify toast (same as interview/setup page) ─────────
    return (
      <div className="fixed bottom-6 right-6 z-[200] flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl max-w-sm bg-amber-500/15 border-amber-500/40 text-amber-300">
        <span className="text-lg leading-none mt-0.5">✉️</span>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-snug">{toast.message}</p>
          <button
            onClick={onResend}
            disabled={cooldown > 0}
            className="mt-2 text-xs font-bold underline underline-offset-2 opacity-80 hover:opacity-100 disabled:no-underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {toast.sent
              ? "✓ Email sent!"
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend verification email"}
          </button>
        </div>
        <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity text-lg">✕</button>
      </div>
    );
  }

  // ─ Standard success / error / info toast ───────────────────────
  const s = {
    success: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
    error:   "bg-red-500/15 border-red-500/40 text-red-400",
    info:    "bg-[var(--cyan)]/10 border-[var(--cyan)]/30 text-[var(--cyan)]",
  };
  const emoji = { success: "✅", error: "❌", info: "ℹ️" };
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl max-w-sm ${s[toast.type]}`}>
      <span className="text-lg leading-none">{emoji[toast.type]}</span>
      <span className="text-sm font-semibold leading-relaxed flex-1">{toast.message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity text-lg">✕</button>
    </div>
  );
}

// ─── Booking Modal ────────────────────────────────────────────────────────────
function BookingModal({ teacher, onClose, onBooked }) {
  const window20 = get20DayWindow();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);

  const availMap = {};
  for (const entry of teacher.availability || []) {
    const key = toMidnightUTC(new Date(entry.date)).toISOString();
    availMap[key] = entry;
  }
  const datesWithSlots = window20.filter(date => {
    const entry = availMap[toMidnightUTC(date).toISOString()];
    return entry && !entry.isUnavailable && (entry.slots || []).some(s => !s.isBooked);
  });

  const avatarStyle = getAvatarStyle(teacher.user?.name);
  const isFree = !teacher.fees || Number(teacher.fees) === 0;

  async function confirmBooking() {
    if (!selectedDate || !selectedSlot) return;
    setBooking(true);
    try {
      // ── Free mentor — book directly ───────────────────────────────────────────
      if (isFree) {
        const res = await fetch("/api/v1/teacher/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId: teacher._id, date: selectedDate.toISOString(), slotId: selectedSlot._id }),
        });
        const data = await res.json();
        if (!res.ok) {
          // 403 = email not verified; any other error is generic
          if (res.status === 403 || data.emailNotVerified) {
            onBooked({ type: "warn", message: "Please verify your email to book a session." });
          } else {
            onBooked({ type: "error", message: data.error || "Booking failed" });
          }
          onClose(); return;
        }
        onBooked({ type: "success", message: "Session booked! Check your dashboard." });
        onClose();
        return;
      }

      // ── Paid mentor — Step 1: create Razorpay order ───────────────────────────
      const orderRes = await fetch("/api/v1/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: teacher._id }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        if (orderRes.status === 403 || orderData.emailNotVerified) {
          onBooked({ type: "warn", message: "Please verify your email to book a session." });
        } else {
          onBooked({ type: "error", message: orderData.error || "Could not initiate payment" });
        }
        onClose();
        return;
      }

      // ── Step 2: open Razorpay checkout (key comes from the API response) ──────
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Ace AI Interview",
        description: `Session with ${teacher.user?.name}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          // ── Step 3: payment success — confirm the booking ─────────────────────
          const bookRes = await fetch("/api/v1/teacher/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teacherId: teacher._id,
              date: selectedDate.toISOString(),
              slotId: selectedSlot._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const bookData = await bookRes.json();
          if (!bookRes.ok) {
            onBooked({ type: "error", message: bookData.error || "Booking confirmation failed" });
          } else {
            onBooked({ type: "success", message: "Payment successful! Session booked." });
          }
          onClose();
        },
        modal: {
          ondismiss: () => { setBooking(false); },
        },
        theme: { color: "#06b6d4" },
      };
      new window.Razorpay(options).open();
      setBooking(false);
    } catch {
      onBooked({ type: "error", message: "Something went wrong. Try again." });
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[var(--cyan)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface-2)]/50">
          <div>
            <p className="font-black text-[var(--foreground)]">Book a Session</p>
            <p className="text-xs text-[var(--muted)]">with {teacher.user?.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-1">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${step >= s ? "text-[var(--cyan)]" : "text-[var(--muted)]"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${step >= s ? "border-[var(--cyan)] bg-[var(--cyan)]/15" : "border-[var(--border)] bg-transparent"}`}>{s}</div>
                <span className="text-xs font-semibold">{s === 1 ? "Pick a date" : "Pick a time"}</span>
              </div>
              {s < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step >= 2 ? "bg-[var(--cyan)]" : "bg-[var(--border)]"}`} />}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            datesWithSlots.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">📅</p>
                <p className="font-semibold text-[var(--foreground)]">No slots available</p>
                <p className="text-sm text-[var(--muted)] mt-1">This mentor has no open slots in the next 20 days.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {datesWithSlots.map(date => {
                  const isSelected = selectedDate && toMidnightUTC(date).getTime() === toMidnightUTC(selectedDate).getTime();
                  const dt = new Date(date);
                  return (
                    <button key={date.toISOString()} onClick={() => { setSelectedDate(date); setSelectedSlot(null); setStep(2); }}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${isSelected ? "border-[var(--cyan)] bg-[var(--cyan)]/10" : "border-[var(--border)] hover:border-[var(--cyan)]/50 hover:bg-[var(--surface-2)]"}`}>
                      <p className={`text-xs font-semibold ${isSelected ? "text-[var(--cyan)]" : "text-[var(--muted)]"}`}>{DAY_SHORT[dt.getUTCDay()]}</p>
                      <p className={`font-black text-base ${isSelected ? "text-[var(--cyan)]" : "text-[var(--foreground)]"}`}>{dt.getUTCDate()}</p>
                      <p className={`text-xs ${isSelected ? "text-[var(--cyan)]" : "text-[var(--muted)]"}`}>{MONTHS_SHORT[dt.getUTCMonth()]}</p>
                    </button>
                  );
                })}
              </div>
            )
          )}

          {step === 2 && selectedDate && (() => {
            const entry = availMap[toMidnightUTC(selectedDate).toISOString()];
            const slots = (entry?.slots || []).filter(s => !s.isBooked);
            return (
              <div className="space-y-3">
                <button onClick={() => { setStep(1); setSelectedSlot(null); }} className="text-xs text-[var(--cyan)] font-semibold hover:underline flex items-center gap-1">
                  ← Back to dates
                </button>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {DAY_SHORT[new Date(selectedDate).getUTCDay()]}, {new Date(selectedDate).getUTCDate()} {MONTHS_SHORT[new Date(selectedDate).getUTCMonth()]}
                </p>
                {slots.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No slots for this date.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map(slot => {
                      const isSelected = selectedSlot?._id === slot._id;
                      return (
                        <button key={slot._id} onClick={() => setSelectedSlot(slot)}
                          className={`py-3 rounded-xl border text-sm font-bold transition-all ${isSelected ? "border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--cyan)]" : "border-[var(--border)] hover:border-[var(--cyan)]/50 text-[var(--foreground)]"}`}>
                          {slot.startTime} – {slot.endTime}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedSlot && (
                  <button onClick={confirmBooking} disabled={booking}
                    className="w-full py-3 rounded-xl font-black text-sm text-white disabled:opacity-60 transition-all hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, var(--cyan), var(--accent))" }}>
                    {booking ? "Booking…" : isFree ? "Confirm Free Session" : `Pay ₹${teacher.fees} & Book`}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Main Mentor Profile Page ──────────────────────────────────────────────────
export default function MentorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, isVerified } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [toast, setToast] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleResendVerification() {
    if (resendCooldown > 0) return;
    try {
      const res = await fetch("/api/v1/user/resend-verification", { method: "POST" });
      if (res.ok) {
        setToast(prev => prev ? { ...prev, sent: true } : prev);
        setResendCooldown(60);
      }
    } catch {}
  }

  const username = params?.username;

  useEffect(() => {
    if (!username) return;
    fetch("/api/v1/teacher")
      .then(r => r.json())
      .then(d => {
        const found = (d.teachers || []).find(t => t.username === username);
        if (!found) { setNotFound(true); return; }
        setTeacher(found);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  const handleBook = useCallback(() => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!isVerified) {
      setToast({ type: "warn", message: "Please verify your email to book a session." });
      return;
    }
    setShowBooking(true);
  }, [isLoggedIn, isVerified, router]);

  const handleBooked = useCallback((toastData) => {
    setToast(toastData);
    fetch("/api/v1/teacher")
      .then(r => r.json())
      .then(d => {
        const found = (d.teachers || []).find(t => t.username === username);
        if (found) setTeacher(found);
      })
      .catch(() => {});
  }, [username]);

  const window20 = get20DayWindow();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[var(--cyan)]/15" />
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-[var(--surface-2)] border-t-[var(--cyan)]" />
        </div>
        <p className="text-[var(--muted)] animate-pulse font-medium">Loading profile…</p>
      </div>
    </div>
  );

  if (notFound || !teacher) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="title-text text-2xl font-black mb-2">Mentor not found</h1>
        <p className="muted-text mb-6">This mentor doesn't exist or their profile is unavailable.</p>
        <button onClick={() => router.push("/mentors")} className="btn-primary px-6 py-2.5 rounded-xl">← Browse Mentors</button>
      </div>
    </div>
  );

  const avatarStyle = getAvatarStyle(teacher.user?.name);
  const isFree = !teacher.fees || Number(teacher.fees) === 0;
  const currentExp = teacher.workExperiences?.find(w => w.isCurrent) || teacher.workExperiences?.[0];
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
  const datesWithSlots = window20.filter(date => {
    const entry = availMap[toMidnightUTC(date).toISOString()];
    return entry && !entry.isUnavailable && (entry.slots || []).some(s => !s.isBooked);
  });

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="page-shell mx-auto max-w-4xl px-5 py-12 sm:px-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--cyan)]/4 rounded-full blur-[160px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--accent)]/4 rounded-full blur-[140px] -z-10 pointer-events-none" />

        <button onClick={() => router.push("/mentors")} className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-12 group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          Back to Mentors
        </button>

        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-16">
          <div className="w-32 h-32 rounded-3xl flex items-center justify-center text-5xl font-black overflow-hidden ring-4 ring-[var(--surface-2)] shadow-2xl flex-shrink-0"
            style={teacher.user?.image ? {} : avatarStyle}>
            {teacher.user?.image
              ? <img src={teacher.user.image} alt={teacher.user?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : <span style={{ color: avatarStyle.color }}>{teacher.user?.name?.charAt(0)?.toUpperCase()}</span>
            }
          </div>
          <div className="flex-1">
            <h1 className="title-text text-4xl font-black leading-tight mb-2">{teacher.user?.name}</h1>
            {currentExp && (
              <p className="text-[var(--cyan)] text-lg font-semibold mb-2">{currentExp.position} @ {currentExp.company}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-5">
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                 <span className="text-xl font-black text-[var(--foreground)]">{isFree ? "Free" : `₹${teacher.fees}`}</span>
                 <span className="text-xs text-[var(--muted)] font-medium">{isFree ? "" : "/ session"}</span>
               </div>
               <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border ${totalAvailable > 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)]"}`}>
                  <span className={`w-2 h-2 rounded-full ${totalAvailable > 0 ? "bg-emerald-400 animate-pulse" : "bg-[var(--muted)]"}`} />
                  {totalAvailable > 0 ? `${totalAvailable} slots open` : "Fully booked"}
               </div>
            </div>
          </div>
        </div>

        {/* 2. About & Expertise */}
        <div className="mb-20 space-y-12">
           {teacher.bio && (
             <div>
               <h2 className="title-text text-2xl font-black mb-4">About</h2>
               <p className="text-[var(--soft-text)] leading-relaxed text-lg">{teacher.bio}</p>
             </div>
           )}
           {teacher.expertise?.length > 0 && (
             <div>
               <h2 className="title-text text-2xl font-black mb-4">Expertise</h2>
               <div className="flex flex-wrap gap-2">
                 {teacher.expertise.map(tag => (
                   <span key={tag} className="px-4 py-2 rounded-xl text-sm font-bold border border-[var(--cyan)]/20 bg-[var(--cyan)]/5 text-[var(--cyan)] hover:bg-[var(--cyan)]/10 transition-colors">{tag}</span>
                 ))}
               </div>
             </div>
           )}
        </div>

        {/* 3. Work Experience Timeline */}
        {teacher.workExperiences?.length > 0 && (
          <div className="mb-24">
            <div className="text-center mb-16">
               <h4 className="text-[var(--cyan)] text-xs font-black tracking-widest uppercase mb-3">What I have done so far</h4>
               <h2 className="title-text text-4xl sm:text-5xl font-black tracking-tight">Work Experience.</h2>
            </div>
            
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-[var(--surface-2)] md:-ml-px" />
              
              <div className="space-y-12">
                {teacher.workExperiences.map((exp, i) => {
                  const isEven = i % 2 === 0;
                  return (
                    <div key={i} className={`relative flex flex-col md:flex-row items-start md:items-center ${isEven ? "md:flex-row-reverse" : ""}`}>
                      
                      {/* Node Icon */}
                      <div className="absolute left-0 md:left-1/2 w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg shadow-[0_0_20px_rgba(168,85,247,0.4)] z-10 md:-ml-6 bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-[var(--background)]">
                        {exp.company.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Desktop Date */}
                      <div className={`hidden md:block w-1/2 ${isEven ? "pr-12 text-right" : "pl-12 text-left"}`}>
                        <span className="text-[var(--cyan)] font-semibold text-sm tracking-wide">
                          {fmtMonth(exp.startDate)} – {exp.isCurrent ? "Present" : fmtMonth(exp.endDate)}
                        </span>
                      </div>
                      
                      {/* Card Content */}
                      <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isEven ? "md:pl-12" : "md:pr-12"}`}>
                         <div className="md:hidden mb-2 ml-2">
                           <span className="text-[var(--cyan)] text-sm font-semibold tracking-wide">
                             {fmtMonth(exp.startDate)} – {exp.isCurrent ? "Present" : fmtMonth(exp.endDate)}
                           </span>
                         </div>
                         
                         <div className="bg-[var(--surface-2)]/30 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-6 md:p-8 hover:border-[var(--cyan)]/30 hover:bg-[var(--surface-2)]/50 transition-all duration-300">
                           <h3 className="text-xl md:text-2xl font-black text-[var(--foreground)] mb-1">{exp.position}</h3>
                           <h4 className="text-[var(--cyan)] font-bold text-sm mb-5">{exp.company}</h4>
                           
                           {exp.description && (
                             <ul className="space-y-3">
                               {exp.description.split('\n').map((line, idx) => line.trim() ? (
                                 <li key={idx} className="text-[var(--soft-text)] text-sm leading-relaxed flex items-start gap-3">
                                   <span className="text-indigo-400 mt-[6px] w-1.5 h-1.5 rounded-full flex-shrink-0 bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                                   <span>{line.replace(/^-\s*/, '')}</span>
                                 </li>
                               ) : null)}
                             </ul>
                           )}
                         </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. Booking Section */}
        <div className="border-t border-[var(--border)] pt-16 mb-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="title-text text-3xl font-black mb-3">Book a Session</h2>
            <p className="muted-text">Select a time that works for you. I look forward to our chat!</p>
          </div>
          
          <div className="bg-[var(--surface-2)]/30 border border-[var(--border)] rounded-3xl p-6 md:p-8">
            {datesWithSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-4">📭</p>
                <p className="font-bold text-[var(--foreground)] text-lg">No open slots</p>
                <p className="text-sm text-[var(--muted)] mt-1">Check back later or contact me directly.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-[var(--foreground)] mb-1">Available soonest:</p>
                  <p className="text-sm text-[var(--cyan)] font-semibold">{DAY_SHORT[new Date(datesWithSlots[0]).getUTCDay()]}, {new Date(datesWithSlots[0]).getUTCDate()} {MONTHS_SHORT[new Date(datesWithSlots[0]).getUTCMonth()]}</p>
                </div>
                <button
                  onClick={handleBook}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, var(--cyan), var(--accent))" }}
                >
                  📅 View Schedule & Book
                </button>
              </div>
            )}
            {!isLoggedIn && (
              <p className="text-xs text-center text-[var(--muted)] mt-5">You'll need to <button onClick={() => router.push("/login")} className="text-[var(--cyan)] font-semibold hover:underline">log in</button> to book.</p>
            )}
          </div>
        </div>

      </div>

      {showBooking && <BookingModal teacher={teacher} onClose={() => setShowBooking(false)} onBooked={handleBooked} />}
      <Toast toast={toast} onClose={() => setToast(null)} onResend={handleResendVerification} cooldown={resendCooldown} />
    </>
  );
}
