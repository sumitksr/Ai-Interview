"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS = {
  confirmed: "text-green-400 bg-green-500/10 border-green-500/25",
  pending:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
  cancelled: "text-red-400 bg-red-500/10 border-red-500/25",
  completed: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
};
const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "completed"];

export default function AdminMeets() {
  const router = useRouter();
  const [meets, setMeets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [changingStatus, setChangingStatus] = useState(null);

  useEffect(() => {
    fetch("/api/v1/admin/meets")
      .then((r) => { if (r.status === 403) { router.replace("/dashboard"); throw new Error(); } return r.json(); })
      .then((d) => { setMeets(d.meets || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  async function updateStatus(bookingId, status) {
    setChangingStatus(bookingId);
    const res = await fetch("/api/v1/admin/meets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, status }),
    });
    if (res.ok) {
      setMeets((prev) => prev.map((m) => m._id.toString() === bookingId ? { ...m, status } : m));
    }
    setChangingStatus(null);
  }

  const filtered = meets
    .filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        m.student?.name?.toLowerCase().includes(q) ||
        m.student?.email?.toLowerCase().includes(q) ||
        m.mentor?.name?.toLowerCase().includes(q) ||
        m.bookid?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.scheduledDate) - new Date(a.scheduledDate);
      if (sortBy === "date-asc") return new Date(a.scheduledDate) - new Date(b.scheduledDate);
      if (sortBy === "amount-desc") return (b.amountPaid || 0) - (a.amountPaid || 0);
      return 0;
    });

  // Totals for the filter bar
  const counts = { all: meets.length };
  for (const s of STATUS_OPTIONS) counts[s] = meets.filter((m) => m.status === s).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-14 w-14 border-4 border-[var(--surface-2)] border-t-red-500" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight">Meets</h1>
        <p className="text-[var(--muted)] mt-1">Every booking between students and mentors — view and manage status.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", val: meets.length, color: "#38bdf8" },
          { label: "Confirmed", val: counts.confirmed || 0, color: "#22c55e" },
          { label: "Completed", val: counts.completed || 0, color: "#06b6d4" },
          { label: "Cancelled", val: counts.cancelled || 0, color: "#ef4444" },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-[var(--surface)]/60 border border-[var(--border)] rounded-2xl p-4 text-center">
            <p className="text-2xl font-black" style={{ color }}>{val}</p>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search student, mentor, or booking ID…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-red-500/50" />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {["all", ...STATUS_OPTIONS].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${statusFilter === s ? "text-white" : "text-[var(--muted)] bg-[var(--surface-2)] border border-[var(--border)]"}`}
              style={statusFilter === s ? { background: "linear-gradient(135deg, #ef4444, #dc2626)" } : {}}>
              {s} {counts[s] !== undefined && <span className="opacity-70">({counts[s]})</span>}
            </button>
          ))}
        </div>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-red-500/50 cursor-pointer">
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Highest amount</option>
        </select>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Showing <strong className="text-[var(--foreground)]">{filtered.length}</strong> of {meets.length} meets
      </p>

      {/* Table */}
      <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/50">
                {["Student", "Mentor", "Date & Time", "Status", "Payment", "Update Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m._id} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface-2)]/30 transition-colors">
                  {/* Student */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      {m.student?.image
                        ? <img src={m.student.image} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#1565c0,#42a5f5)", color: "#fff" }}>
                            {m.student?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--foreground)] truncate max-w-[120px]">{m.student?.name || "—"}</p>
                        <p className="text-xs text-[var(--muted)] truncate max-w-[120px]">{m.student?.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Mentor */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      {m.mentor?.image
                        ? <img src={m.mentor.image} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#e0d9ff" }}>
                            {m.mentor?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                      }
                      <p className="font-semibold text-[var(--foreground)] truncate max-w-[120px]">{m.mentor?.name || "—"}</p>
                    </div>
                  </td>
                  {/* Date */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="font-semibold text-[var(--foreground)] text-xs">
                      {new Date(m.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{m.startTime} – {m.endTime} IST</p>
                  </td>
                  {/* Status badge */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_COLORS[m.status] || STATUS_COLORS.pending}`}>
                      {m.status}
                    </span>
                  </td>
                  {/* Payment */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className={`text-xs font-bold ${m.paymentStatus === "paid" ? "text-green-400" : m.paymentStatus === "free" ? "text-cyan-400" : "text-yellow-400"}`}>
                      {m.paymentStatus === "paid" ? `₹${m.amountPaid}` : m.paymentStatus === "free" ? "Free" : m.paymentStatus}
                    </p>
                  </td>
                  {/* Status updater */}
                  <td className="px-5 py-4">
                    <select
                      value={m.status}
                      disabled={changingStatus === m._id.toString()}
                      onChange={(e) => updateStatus(m._id.toString(), e.target.value)}
                      className="text-xs rounded-lg px-2 py-1.5 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-red-500/50 disabled:opacity-50 cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-[var(--muted)] text-sm">No meets found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
