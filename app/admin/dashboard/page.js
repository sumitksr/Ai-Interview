"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";

function StatCard({ icon, label, value, sub, color = "#38bdf8", gradient }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 border border-[var(--border)] hover:-translate-y-1 transition-all duration-300 group"
      style={{ background: "linear-gradient(145deg, var(--surface), var(--surface-2))" }}>
      <div className="absolute -right-3 -top-3 text-5xl opacity-10 group-hover:opacity-20 transition-opacity select-none">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">{label}</p>
      <p className="text-4xl font-black mb-1" style={{ color: gradient ? "transparent" : color,
        background: gradient || "none", WebkitBackgroundClip: gradient ? "text" : "none", backgroundClip: gradient ? "text" : "none" }}>
        {value}
      </p>
      {sub && <p className="text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

const COLORS = ["#22c55e", "#38bdf8", "#ef4444"];

export default function AdminDashboard() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [signupChart, setSignupChart] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [recentMeets, setRecentMeets] = useState([]);

  useEffect(() => {
    async function init() {
      // Try to sync OAuth session — but only redirect based on role if sync succeeds.
      // JWT-cookie logins (email/password) return { ok: false } from session-sync,
      // so we must NOT redirect in that case; the API routes check the JWT cookie themselves.
      try {
        const r = await fetch("/api/auth/session-sync");
        const s = await r.json();
        if (s.ok) {
          login({ name: s.name, image: s.image, role: s.role });
          if (s.role !== "admin") { router.replace("/dashboard"); return; }
        }
      } catch { }

      const [statsRes, meetsRes] = await Promise.all([
        fetch("/api/v1/admin/stats"),
        fetch("/api/v1/admin/meets"),
      ]);

      // 401 = not logged in at all, 403 = not admin
      if (statsRes.status === 401 || statsRes.status === 403) { router.replace("/dashboard"); return; }

      const statsData = await statsRes.json();
      const meetsData = await meetsRes.json();

      setStats(statsData.stats);
      setSignupChart(statsData.signupChart || []);
      setPieData(statsData.bookingStatusBreakdown || []);
      setRecentMeets((meetsData.meets || []).slice(0, 8));
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-14 w-14 border-4 border-[var(--surface-2)] border-t-red-500" />
    </div>
  );

  const statusColors = { confirmed: "text-green-400 bg-green-500/10 border-green-500/25", pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25", cancelled: "text-red-400 bg-red-500/10 border-red-500/25", completed: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25" };

  // Build API usage metrics from existing stats (no new model needed)
  const apiUsageData = stats ? [
    { name: "Interviews", calls: stats.totalInterviews, color: "#38bdf8" },
    { name: "Bookings", calls: stats.totalBookings, color: "#a78bfa" },
    { name: "Users", calls: stats.totalUsers, color: "#22c55e" },
    { name: "Mentors", calls: stats.totalTeachers, color: "#f59e0b" },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 border text-xs font-bold uppercase tracking-widest"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Admin Control Panel
        </div>
        <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight">Overview</h1>
        <p className="text-[var(--muted)] mt-1">Platform-wide analytics and activity at a glance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Students" value={stats.totalUsers} sub={`+${stats.newUsersThisWeek} this week`} color="#38bdf8" />
        <StatCard icon="🎓" label="Total Mentors" value={stats.totalTeachers} color="#22c55e" />
        <StatCard icon="📅" label="Total Meets" value={stats.totalBookings} sub={`${stats.confirmedBookings} confirmed`} color="#a78bfa" />
        <StatCard icon="💰" label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} color="#f59e0b" />
        <StatCard icon="🎯" label="Total Interviews" value={stats.totalInterviews} color="#38bdf8" />
        <StatCard icon="📊" label="Avg Score" value={`${stats.platformAvgScore}%`} color="#22c55e" />
        <StatCard icon="✅" label="Completed Meets" value={stats.completedBookings} color="#06b6d4" />
        <StatCard icon="❌" label="Cancelled Meets" value={stats.cancelledBookings} color="#ef4444" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Signup chart */}
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 shadow-xl">
          <h3 className="font-bold text-[var(--foreground)] mb-1">New Student Signups</h3>
          <p className="text-xs text-[var(--muted)] mb-5">Last 7 days</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSignup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)", borderColor: "var(--border)", borderRadius: 12 }}
                  itemStyle={{ color: "#ef4444", fontWeight: 700 }} labelStyle={{ color: "var(--muted)", fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#gSignup)"
                  dot={{ r: 4, fill: "#ef4444", stroke: "var(--surface)", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#f87171", stroke: "var(--surface)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking pie */}
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 shadow-xl flex flex-col">
          <h3 className="font-bold text-[var(--foreground)] mb-1">Booking Status</h3>
          <p className="text-xs text-[var(--muted)] mb-4">All time breakdown</p>
          <div className="flex-1 flex items-center justify-center">
            <PieChart width={220} height={200}>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={10}
                formatter={(v) => <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>{v}</span>} />
              <Tooltip contentStyle={{ background: "rgba(10,15,30,0.92)", borderColor: "var(--border)", borderRadius: 10 }}
                itemStyle={{ fontWeight: 700 }} />
            </PieChart>
          </div>
        </div>
      </div>

      {/* API Usage Section */}
      <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <h3 className="font-bold text-[var(--foreground)]">Platform Activity Overview</h3>
            </div>
            <p className="text-xs text-[var(--muted)]">Cumulative usage across core platform features</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Live data
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {apiUsageData.map((item) => (
            <div key={item.name} className="rounded-2xl p-4 border border-[var(--border)]"
              style={{ background: `${item.color}08`, borderColor: `${item.color}25` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: item.color }}>{item.name}</p>
              <p className="text-3xl font-black" style={{ color: item.color }}>{item.calls.toLocaleString()}</p>
              <p className="text-xs text-[var(--muted)] mt-1">total records</p>
            </div>
          ))}
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={apiUsageData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)", borderColor: "var(--border)", borderRadius: 12 }}
                itemStyle={{ fontWeight: 700 }}
                labelStyle={{ color: "var(--muted)", fontSize: 12 }}
              />
              <Bar dataKey="calls" radius={[6, 6, 0, 0]}>
                {apiUsageData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Meets */}
      <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-[var(--foreground)]">Recent Meets</h3>
            <p className="text-xs text-[var(--muted)]">Latest 8 bookings across the platform</p>
          </div>
          <button onClick={() => router.push("/admin/meets")}
            className="text-xs font-bold text-[var(--cyan)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1">
            View all
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Student", "Mentor", "Date", "Time", "Status", "Payment"].map((h) => (
                  <th key={h} className="text-left pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentMeets.map((m) => (
                <tr key={m._id} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface-2)]/40 transition-colors">
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-semibold text-[var(--foreground)] truncate max-w-[120px]">{m.student?.name || "—"}</p>
                      <p className="text-xs text-[var(--muted)] truncate max-w-[120px]">{m.student?.email}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-[var(--foreground)] truncate max-w-[120px]">{m.mentor?.name || "—"}</p>
                  </td>
                  <td className="py-3 pr-4 text-[var(--muted)] whitespace-nowrap">
                    {new Date(m.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}
                  </td>
                  <td className="py-3 pr-4 text-[var(--muted)] whitespace-nowrap">{m.startTime}–{m.endTime}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${statusColors[m.status] || statusColors.pending}`}>
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs font-bold ${m.paymentStatus === "paid" ? "text-green-400" : m.paymentStatus === "free" ? "text-cyan-400" : "text-yellow-400"}`}>
                      {m.paymentStatus === "paid" ? `₹${m.amountPaid}` : m.paymentStatus === "free" ? "Free" : m.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {recentMeets.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-[var(--muted)] text-sm">No meets yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
