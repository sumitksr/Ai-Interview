"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const starPath = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className="w-3.5 h-3.5" viewBox="0 0 20 20"
          fill={s <= rating ? "#f59e0b" : "none"} stroke={s <= rating ? "#f59e0b" : "var(--border)"} strokeWidth="1.5">
          <path d={starPath}/>
        </svg>
      ))}
      <span className="text-xs font-bold text-[var(--muted)] ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function EditModal({ mentor, onClose, onSave }) {
  const [fees, setFees] = useState(mentor.fees ?? 0);
  const [bio, setBio] = useState(mentor.bio ?? "");
  const [expertise, setExpertise] = useState((mentor.expertise || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true); setError("");
    const res = await fetch("/api/v1/admin/mentors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId: mentor._id,
        fees: Number(fees),
        bio,
        expertise: expertise.split(",").map((e) => e.trim()).filter(Boolean),
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error || "Failed to save."); setSaving(false); return; }
    onSave({ ...mentor, fees: Number(fees), bio, expertise: expertise.split(",").map((e) => e.trim()).filter(Boolean) });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl p-6 border border-[var(--border)] shadow-2xl space-y-4"
        style={{ background: "var(--surface)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--foreground)] text-lg">Edit Mentor</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-all">✕</button>
        </div>
        <p className="text-sm text-[var(--muted)]">{mentor.user?.name} ({mentor.username})</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Fees (₹)</label>
            <input type="number" min={0} value={fees} onChange={(e) => setFees(e.target.value)}
              className="mt-1 w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] px-3 py-2.5 focus:outline-none focus:border-red-500/50" />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Bio</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] px-3 py-2.5 resize-none focus:outline-none focus:border-red-500/50 placeholder-[var(--muted)]"
              placeholder="Mentor bio…" />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Expertise (comma-separated)</label>
            <input type="text" value={expertise} onChange={(e) => setExpertise(e.target.value)}
              className="mt-1 w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] px-3 py-2.5 focus:outline-none focus:border-red-500/50"
              placeholder="React, Node.js, System Design…" />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--muted)] bg-[var(--surface-2)] border border-[var(--border)] hover:text-[var(--foreground)] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminMentors() {
  const router = useRouter();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    fetch("/api/v1/admin/mentors")
      .then((r) => { if (r.status === 403) { router.replace("/dashboard"); throw new Error(); } return r.json(); })
      .then((d) => { setMentors(d.mentors || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const filtered = mentors.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.user?.name?.toLowerCase().includes(q) || m.username?.toLowerCase().includes(q) ||
      m.expertise?.some((e) => e.toLowerCase().includes(q));
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-14 w-14 border-4 border-[var(--surface-2)] border-t-red-500" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      {editTarget && (
        <EditModal
          mentor={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(updated) => {
            setMentors((prev) => prev.map((m) => m._id === updated._id ? updated : m));
            setEditTarget(null);
          }}
        />
      )}

      <div>
        <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight">Mentors</h1>
        <p className="text-[var(--muted)] mt-1">All registered mentors — edit details and view reviews.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="Search mentors…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-red-500/50" />
      </div>

      <p className="text-sm text-[var(--muted)]"><strong className="text-[var(--foreground)]">{filtered.length}</strong> mentor{filtered.length !== 1 ? "s" : ""}</p>

      {/* Cards grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((m) => {
          const isExpanded = expanded === m._id?.toString();
          return (
            <div key={m._id} className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl hover:-translate-y-1 transition-all duration-300">
              {/* Card header */}
              <div className="p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 overflow-hidden ring-2 ring-[var(--border)]"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#e0d9ff" }}>
                  {m.user?.image
                    ? <img src={m.user.image} alt={m.user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    : m.user?.name?.charAt(0)?.toUpperCase() || "M"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--foreground)] truncate">{m.user?.name || "Mentor"}</p>
                      <p className="text-xs text-[var(--muted)] truncate">@{m.username}</p>
                    </div>
                    <button onClick={() => setEditTarget(m)}
                      className="flex-shrink-0 flex items-center gap-1 text-xs text-[var(--muted)] hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/8">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                      </svg>
                      Edit
                    </button>
                  </div>
                  {m.avgRating > 0 && <Stars rating={m.avgRating} />}
                </div>
              </div>

              {/* Expertise tags */}
              {m.expertise?.length > 0 && (
                <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                  {m.expertise.slice(0, 4).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md text-xs font-semibold border border-[var(--cyan)]/20 bg-[var(--cyan)]/5 text-[var(--cyan)]">{tag}</span>
                  ))}
                  {m.expertise.length > 4 && <span className="text-xs text-[var(--muted)]">+{m.expertise.length - 4}</span>}
                </div>
              )}

              {/* Stats row */}
              <div className="px-5 pb-4 grid grid-cols-4 gap-2 border-t border-[var(--border)]/50 pt-3">
                {[
                  { label: "Bookings", val: m.totalBookings, color: "#38bdf8" },
                  { label: "Earnings", val: `₹${m.earnings}`, color: "#f59e0b" },
                  { label: "Reviews", val: m.totalReviews, color: "#a78bfa" },
                  { label: "Fees", val: m.fees === 0 ? "Free" : `₹${m.fees}`, color: "#22c55e" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center">
                    <p className="font-black text-sm" style={{ color }}>{val}</p>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>

              {/* Toggle reviews */}
              {m.reviews?.length > 0 && (
                <div className="border-t border-[var(--border)]/50">
                  <button onClick={() => setExpanded(isExpanded ? null : m._id?.toString())}
                    className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/30 transition-all">
                    Reviews ({m.totalReviews})
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-3">
                      {m.reviews.map((r, i) => (
                        <div key={i} className="bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border)]">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-[var(--foreground)]">{r.user?.name || "User"}</p>
                            <Stars rating={r.rating} />
                          </div>
                          {r.comment && <p className="text-xs text-[var(--muted)] italic">"{r.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 py-20 text-center text-[var(--muted)]">No mentors found.</div>
        )}
      </div>
    </div>
  );
}
