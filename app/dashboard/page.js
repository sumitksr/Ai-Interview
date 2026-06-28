"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, BarChart, Bar, Cell,
} from "recharts";
import { useAuth } from "@/context/AuthContext";

// ─── Avatar helper (for mentor cards) ────────────────────────────────────────
const AVATAR_COLORS = [
  ["#d32f2f", "#ef9a9a"], ["#1565c0", "#90caf9"], ["#2e7d32", "#a5d6a7"],
  ["#e65100", "#ffcc80"], ["#6a1b9a", "#ce93d8"], ["#00695c", "#80cbc4"],
  ["#ad1457", "#f48fb1"], ["#0277bd", "#81d4fa"], ["#558b2f", "#c5e1a5"],
  ["#4527a0", "#b39ddb"],
];
function getAvatarStyle(name) {
  if (!name) return { background: "#1565c0", color: "#90caf9" };
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [bg, text] = AVATAR_COLORS[index];
  return { background: bg, color: text };
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

const scoreColor = (s) => s >= 80 ? "#22c55e" : s >= 60 ? "#06b6d4" : s >= 40 ? "#f59e0b" : "#ef4444";
const scoreGrade = (s) => {
  if (s >= 85) return { label: "Excellent",  cls: "text-green-400  bg-green-500/10  border-green-500/25"  };
  if (s >= 70) return { label: "Good",        cls: "text-cyan-400   bg-cyan-500/10   border-cyan-500/25"   };
  if (s >= 55) return { label: "Average",     cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25" };
  return              { label: "Needs Work",  cls: "text-red-400    bg-red-500/10    border-red-500/25"    };
};
const hiringCls = (rec = "") => {
  const r = rec.toLowerCase();
  if (r.includes("strong yes")) return "text-green-400  bg-green-500/10  border-green-500/30";
  if (r.includes("yes"))        return "text-cyan-400   bg-cyan-500/10   border-cyan-500/30";
  if (r.includes("maybe"))      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  return                               "text-red-400    bg-red-500/10    border-red-500/30";
};

// ─── Score Ring ───────────────────────────────────────────────────────────────
function Ring({ score, size = 80, stroke = 7 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="font-black" style={{ color, fontSize: size * 0.22 }}>{score}</span>
        <span className="text-[var(--muted)]" style={{ fontSize: size * 0.1 }}>/ 100</span>
      </div>
    </div>
  );
}

// ─── Pill badge ───────────────────────────────────────────────────────────────
function Pill({ children, cls = "" }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {children}
    </span>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionTitle({ icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 flex items-center justify-center text-[var(--cyan)] flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-[var(--foreground)] leading-tight">{title}</h3>
        {sub && <p className="text-xs text-[var(--muted)]">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const { login } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [selIdx, setSelIdx]     = useState(0);
  const [activeTab, setActiveTab] = useState("overview"); // overview | questions
  const [expandedQ, setExpandedQ] = useState(null);
  const [mentors, setMentors]   = useState([]);

  useEffect(() => {
    // Wake up socket server
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (socketUrl) {
      fetch(`${socketUrl}/check`).catch(() => {});
    }

    fetch("/api/v1/dashboard")
      .then(r => {
        if (r.status === 401) {
          // Genuinely unauthenticated — redirect to login
          router.push("/login");
          throw new Error("unauthorized");
        }
        return r.json();
      })
      .then(async (d) => {
        // Sync OAuth session cookie if needed before any redirects
        const hasLoginCookie = document.cookie.includes("isLoggedIn=true");
        if (!hasLoginCookie) {
          try {
            const r = await fetch("/api/auth/session-sync");
            const s = await r.json();
            if (s.ok) login({ name: s.name, image: s.image, role: s.role });
          } catch (e) {}
        }

        if (d.user?.role === "teacher") {
          router.replace("/mentor/dashboard");
          return;
        }
        if (d.user?.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }
        
        setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load featured mentors
    fetch("/api/v1/teacher")
      .then((r) => r.json())
      .then((d) => setMentors((d.teachers || []).slice(0, 3)))
      .catch(() => {});
  }, [router]);


  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-shell flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-[var(--cyan)]/15" />
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-[var(--surface-2)] border-t-[var(--cyan)]" />
      </div>
      <p className="text-[var(--muted)] animate-pulse font-medium">Loading your analytics…</p>
    </div>
  );

  if (!data) return null;

  const { user, userData } = data;
  const history = userData?.interviewHistory || [];

  // ─── Empty state ─────────────────────────────────────────────────────────
  if (history.length === 0) return (
    <div className="page-shell mx-auto max-w-4xl px-5 py-20 flex flex-col items-center justify-center min-h-[70vh] text-center relative">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[var(--accent)]/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-[var(--cyan)]/10  rounded-full blur-[100px] -z-10" />
      <div className="bg-[var(--surface)]/50 backdrop-blur-xl border border-[var(--border)] rounded-3xl p-12 shadow-2xl max-w-2xl w-full">
        <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-[var(--cyan)] to-[var(--accent)] rounded-2xl flex items-center justify-center mb-8 shadow-xl -rotate-6">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/>
          </svg>
        </div>
        <h1 className="title-text text-4xl font-black mb-3">Welcome, {user?.name}!</h1>
        <p className="muted-text text-lg mb-8 leading-relaxed">No interviews yet. Complete your first session to unlock detailed AI analysis, score tracking, and personalised coaching.</p>
        <Link href="/interview/setup" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)] rounded-2xl hover:scale-105 shadow-xl transition-all">
          Start Your First Interview
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </Link>
      </div>
    </div>
  );

  // ─── Derived data ─────────────────────────────────────────────────────────
  const sorted   = [...history].reverse();
  const sel      = sorted[selIdx] || sorted[0];
  const selGrade = scoreGrade(sel?.score || 0);

  const latestScore   = history[history.length - 1]?.score || 0;
  const prevScore     = history.length > 1 ? history[history.length - 2]?.score || 0 : 0;
  const scoreChange   = history.length > 1 ? latestScore - prevScore : 0;
  const bestScore     = Math.max(...history.map(iv => iv.score || 0));
  const answeredQs    = sel?.questions?.filter(q => q.answer?.trim()).length || 0;
  const totalQs       = sel?.questions?.length || 0;

  const chartData = history.map((iv, i) => ({
    name: `#${i + 1}`,
    score: iv.score || 0,
    role: iv.targetRole || "Interview",
    date: new Date(iv.date).toLocaleDateString(),
  }));

  // Radar chart data — average per-question score grouped into themes
  const radarData = sel?.questions?.map((q, i) => ({
    subject: `Q${i + 1}`,
    score: q.score || 0,
    fullMark: 100,
  })) || [];

  // Bar chart — per question scores
  const barData = sel?.questions?.map((q, i) => ({
    name: `Q${i + 1}`,
    score: q.score || 0,
  })) || [];

  return (
    <div className="page-shell mx-auto max-w-7xl px-4 py-10 sm:px-8 relative">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--cyan)]/4 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--accent)]/4 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 mb-3">
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--cyan)]">Candidate Analytics</p>
          </div>
          <h1 className="title-text text-4xl sm:text-5xl font-black tracking-tight">Dashboard</h1>
          <p className="muted-text mt-2 text-base">Hello, <span className="text-[var(--foreground)] font-semibold">{user?.name}</span> — here's your full performance report.</p>
        </div>
        <Link href="/interview/setup" className="btn-primary whitespace-nowrap self-start sm:self-auto shadow-lg shadow-[var(--cyan)]/20 hover:shadow-[var(--cyan)]/40 transition-shadow">
          + New Session
        </Link>
      </div>

      {/* ── Top stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Sessions",  val: userData?.interviewsTaken || 0, suffix: "",  icon: "🎯", color: "from-[var(--foreground)] to-[var(--muted)]" },
          { label: "Average Score",   val: userData?.averageScore    || 0, suffix: "%", icon: "📊", color: "from-[var(--cyan)] to-[var(--accent)]"      },
          { label: "Best Score",      val: bestScore,                       suffix: "%", icon: "🏆", color: "from-yellow-400 to-amber-500"                },
          { label: "Score Trend",     val: scoreChange > 0 ? `+${scoreChange}` : String(scoreChange), suffix: "", icon: scoreChange >= 0 ? "📈" : "📉",
            color: scoreChange >= 0 ? "from-green-400 to-emerald-500" : "from-red-400 to-rose-500" },
        ].map(({ label, val, suffix, icon, color }) => (
          <div key={label} className="tech-card rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-3 -top-3 text-5xl opacity-10 group-hover:opacity-20 transition-opacity select-none">{icon}</div>
            <p className="soft-text text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${color}`}>
              {val}<span className="text-2xl">{suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* ── Chart + Session List (2-col) ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] mb-8">

        {/* Area chart */}
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 shadow-xl">
          <SectionTitle
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            title="Score Timeline"
            sub="Your progress across all sessions"
          />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--cyan)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)", borderColor: "var(--border)", borderRadius: 12, padding: "10px 14px" }}
                  itemStyle={{ color: "var(--cyan)", fontWeight: 700 }}
                  labelStyle={{ color: "var(--muted)", marginBottom: 4, fontSize: 12 }}
                  formatter={(v, _, p) => [`${v}/100 — ${p.payload.role}`, "Score"]}
                />
                <Area type="monotone" dataKey="score" stroke="var(--cyan)" strokeWidth={3}
                  fillOpacity={1} fill="url(#gScore)"
                  dot={{ r: 4, fill: "var(--cyan)", stroke: "var(--surface)", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session list */}
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-5 shadow-xl flex flex-col">
          <SectionTitle
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            title="Sessions"
            sub="Select to view analysis"
          />
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[280px] pr-1 scrollbar-thin scrollbar-thumb-[var(--border)]">
            {sorted.map((iv, idx) => {
              const g = scoreGrade(iv.score || 0);
              const active = idx === selIdx;
              return (
                <button key={idx} onClick={() => { setSelIdx(idx); setActiveTab("overview"); setExpandedQ(null); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                    active
                      ? "border-[var(--cyan)]/50 bg-[var(--cyan)]/8 shadow-md shadow-[var(--cyan)]/10"
                      : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--cyan)]/25"
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[var(--foreground)] truncate">
                        {iv.targetRole || "Interview Session"}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {new Date(iv.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        {iv.focus ? ` · ${iv.focus}` : ""}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <Pill cls={g.cls}>{g.label}</Pill>
                      <span className="text-xl font-black tabular-nums" style={{ color: scoreColor(iv.score || 0) }}>
                        {iv.score || 0}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Full analysis of selected session ── */}
      {sel && (
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden">

          {/* Analysis header */}
          <div className="relative bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border-b border-[var(--border)] p-8">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-8 blur-3xl" style={{ background: "var(--cyan)" }} />

            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              {/* Score ring */}
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <Ring score={sel.score || 0} size={140} stroke={10} />
                <Pill cls={selGrade.cls}>{selGrade.label}</Pill>
              </div>

              {/* Meta + summary */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-4">
                  {sel.targetRole      && <Pill cls="text-[var(--cyan)] bg-[var(--cyan)]/10 border-[var(--cyan)]/25">{sel.targetRole}</Pill>}
                  {sel.experienceLevel && <Pill cls="text-[var(--muted)] bg-[var(--surface-2)] border-[var(--border)]">{sel.experienceLevel}</Pill>}
                  {sel.focus           && <Pill cls="text-[var(--muted)] bg-[var(--surface-2)] border-[var(--border)]">{sel.focus} Focus</Pill>}
                  <Pill cls="text-[var(--muted)] bg-[var(--surface-2)] border-[var(--border)]">
                    {new Date(sel.date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                  </Pill>
                </div>

                {sel.overallSummary && (
                  <p className="text-[var(--muted)] leading-relaxed mb-5 text-sm md:text-base border-l-2 border-[var(--cyan)]/40 pl-4 italic">
                    "{sel.overallSummary}"
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  {sel.hiringRecommendation && (
                    <div className={`px-4 py-2 rounded-xl border text-sm font-bold ${hiringCls(sel.hiringRecommendation)}`}>
                      🎯 Hiring: {sel.hiringRecommendation}
                    </div>
                  )}
                  <div className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--muted)]">
                    📋 {answeredQs}/{totalQs} answered
                  </div>
                  {sel.resume && (
                    <a href={sel.resume} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl border border-[var(--cyan)]/30 text-[var(--cyan)] text-sm font-medium hover:bg-[var(--cyan)]/8 transition-colors">
                      📄 Resume PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)] px-8">
            {[
              { id: "overview",  label: "Overview"  },
              { id: "questions", label: "Questions" },
              { id: "charts",    label: "Charts"    },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setExpandedQ(null); }}
                className={`px-5 py-4 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[var(--cyan)] text-[var(--cyan)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ── */}
          {activeTab === "overview" && (
            <div className="p-8 space-y-6">

              {/* 4 mini-metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Session Score",    val: `${sel.score || 0}%`, color: scoreColor(sel.score || 0) },
                  { label: "Questions",        val: `${answeredQs}/${totalQs}`, color: "var(--cyan)" },
                  { label: "Hiring Verdict",   val: sel.hiringRecommendation || "—", color: "var(--foreground)", small: true },
                  { label: "Avg Q Score",
                    val: sel.questions?.length
                      ? `${Math.round(sel.questions.reduce((a, q) => a + (q.score || 0), 0) / sel.questions.length)}%`
                      : "—",
                    color: scoreColor(
                      sel.questions?.length
                        ? Math.round(sel.questions.reduce((a, q) => a + (q.score || 0), 0) / sel.questions.length)
                        : 0
                    ) },
                ].map(({ label, val, color, small }) => (
                  <div key={label} className="bg-[var(--surface-2)] rounded-2xl p-4 border border-[var(--border)]">
                    <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider mb-2">{label}</p>
                    <p className={`font-black ${small ? "text-lg" : "text-3xl"}`} style={{ color }}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Strengths + Areas */}
              {(sel.strengths?.length > 0 || sel.areasForImprovement?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sel.strengths?.length > 0 && (
                    <div className="bg-[var(--surface-2)] rounded-2xl p-6 border border-green-500/20">
                      <SectionTitle
                        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
                        title="Strengths"
                        sub="What you did well"
                      />
                      <ul className="space-y-3">
                        {sel.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center flex-shrink-0">
                              <svg width="10" height="10" viewBox="0 0 20 20" fill="#22c55e"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                            </span>
                            <span className="text-sm text-[var(--muted)] leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {sel.areasForImprovement?.length > 0 && (
                    <div className="bg-[var(--surface-2)] rounded-2xl p-6 border border-yellow-500/20">
                      <SectionTitle
                        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>}
                        title="Areas to Improve"
                        sub="Focus here for your next session"
                      />
                      <ul className="space-y-3">
                        {sel.areasForImprovement.map((a, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-1 w-5 h-5 rounded-full bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center flex-shrink-0">
                              <svg width="10" height="10" viewBox="0 0 20 20" fill="#f59e0b"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                            </span>
                            <span className="text-sm text-[var(--muted)] leading-relaxed">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Next steps */}
              {sel.nextSteps && (
                <div className="bg-gradient-to-br from-[var(--cyan)]/8 to-[var(--accent)]/8 border border-[var(--cyan)]/20 rounded-2xl p-6">
                  <SectionTitle
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>}
                    title="Recommended Next Steps"
                    sub="Personalised coaching from GPT-4o Mini"
                  />
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{sel.nextSteps}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Questions ── */}
          {activeTab === "questions" && (
            <div className="p-8">
              {sel.questions?.length > 0 ? (
                <div className="space-y-4">
                  {sel.questions.map((q, idx) => {
                    const qScore = q.score || 0;
                    const qGrade = scoreGrade(qScore);
                    const isOpen = expandedQ === idx;
                    const hasMistake = q.mistake && !q.mistake.toLowerCase().startsWith("none");
                    return (
                      <div key={idx} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "border-[var(--cyan)]/30 shadow-lg shadow-[var(--cyan)]/5" : "border-[var(--border)]"}`}>
                        {/* Question row */}
                        <button onClick={() => setExpandedQ(isOpen ? null : idx)}
                          className="w-full text-left p-5 flex items-center gap-4 hover:bg-[var(--surface-2)]/40 transition-colors">
                          <Ring score={qScore} size={58} stroke={5} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Q{idx + 1}</span>
                              <Pill cls={qGrade.cls}>{qGrade.label}</Pill>
                              {hasMistake && <Pill cls="text-red-400 bg-red-500/8 border-red-500/25">⚠ Mistake</Pill>}
                              {q.betterApproach && <Pill cls="text-green-400 bg-green-500/8 border-green-500/25">✦ Tip available</Pill>}
                            </div>
                            <p className="text-[var(--foreground)] font-semibold text-sm leading-snug line-clamp-2">{q.question}</p>
                          </div>
                          {/* Progress bar preview */}
                          <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 w-20">
                            <span className="text-xs text-[var(--muted)]">{qScore}/100</span>
                            <div className="w-full h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${qScore}%`, background: scoreColor(qScore) }} />
                            </div>
                          </div>
                          <svg className={`w-5 h-5 text-[var(--muted)] flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                          </svg>
                        </button>

                        {/* Expanded detail */}
                        {isOpen && (
                          <div className="border-t border-[var(--border)] p-6 space-y-4 bg-[var(--surface-2)]/15">
                            {/* Your answer */}
                            <div className="p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                Your Answer
                              </p>
                              <p className="text-[var(--foreground)] text-sm leading-relaxed">
                                {q.answer?.trim()
                                  ? q.answer
                                  : <em className="text-[var(--muted)]">No answer was recorded for this question.</em>}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* AI Feedback */}
                              {q.feedback && (
                                <div className="p-4 bg-[var(--cyan)]/5 border border-[var(--cyan)]/15 rounded-xl">
                                  <p className="text-xs font-bold text-[var(--cyan)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                    AI Feedback
                                  </p>
                                  <p className="text-[var(--muted)] text-sm leading-relaxed">{q.feedback}</p>
                                </div>
                              )}

                              {/* Mistake */}
                              {hasMistake && (
                                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                    Key Mistake / Gap
                                  </p>
                                  <p className="text-red-300/90 text-sm leading-relaxed">{q.mistake}</p>
                                </div>
                              )}
                            </div>

                            {/* Better Approach */}
                            {q.betterApproach && (
                              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                                <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                  Ideal Approach
                                </p>
                                <p className="text-green-200/90 text-sm leading-relaxed">{q.betterApproach}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-[var(--muted)]">
                  <p className="text-lg font-semibold mb-2">No question data</p>
                  <p className="text-sm">This session doesn't have per-question analysis stored.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Charts ── */}
          {activeTab === "charts" && (
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Bar chart */}
              {barData.length > 0 && (
                <div>
                  <SectionTitle
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>}
                    title="Per-Question Scores"
                    sub="How you scored on each question"
                  />
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                        <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)", borderColor: "var(--border)", borderRadius: 10 }}
                          itemStyle={{ color: "var(--cyan)", fontWeight: 700 }}
                          labelStyle={{ color: "var(--muted)", fontSize: 12 }}
                          formatter={(v) => [`${v} / 100`, "Score"]}
                        />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                          {barData.map((entry, i) => (
                            <Cell key={i} fill={scoreColor(entry.score)} fillOpacity={0.85} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Radar chart */}
              {radarData.length >= 3 && (
                <div>
                  <SectionTitle
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                    title="Performance Radar"
                    sub="Relative strength across questions"
                  />
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted)", fontSize: 11 }} />
                        <Radar name="Score" dataKey="score" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.18} strokeWidth={2} />
                        <Tooltip
                          contentStyle={{ background: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)", borderColor: "var(--border)", borderRadius: 10 }}
                          itemStyle={{ color: "var(--cyan)", fontWeight: 700 }}
                          formatter={(v) => [`${v} / 100`, "Score"]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Score distribution */}
              {sel.questions?.length > 0 && (
                <div className="lg:col-span-2">
                  <SectionTitle
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>}
                    title="Score Breakdown"
                    sub="Visual score for every question in this session"
                  />
                  <div className="space-y-3">
                    {sel.questions.map((q, i) => {
                      const s = q.score || 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[var(--muted)] w-6 text-right flex-shrink-0">Q{i + 1}</span>
                          <div className="flex-1 h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s}%`, background: scoreColor(s) }} />
                          </div>
                          <span className="text-sm font-bold tabular-nums flex-shrink-0 w-10 text-right" style={{ color: scoreColor(s) }}>{s}</span>
                          <Pill cls={scoreGrade(s).cls + " flex-shrink-0"}>{scoreGrade(s).label}</Pill>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Book a Mentor ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-[var(--foreground)] leading-tight">Book a Mentor</h3>
              <p className="text-xs text-[var(--muted)]">One-on-one coaching from an expert</p>
            </div>
          </div>
          <Link
            href="/mentors"
            className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cyan)] hover:text-[var(--foreground)] transition-colors"
          >
            View all
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </Link>
        </div>

        {mentors.length === 0 ? (
          <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <p className="font-semibold text-[var(--foreground)] mb-1">No mentors yet</p>
            <p className="text-sm text-[var(--muted)]">Check back soon — mentors are being onboarded.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((teacher) => {
              const availableCount = (teacher.availability || [])
                .filter(a => !a.isUnavailable)
                .reduce((total, a) => total + (a.slots || []).filter(s => !s.isBooked).length, 0);
              const avatarStyle = getAvatarStyle(teacher.user?.name);
              return (
                <div key={teacher._id} className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 overflow-hidden ring-2 ring-white/10"
                      style={teacher.user?.image ? {} : avatarStyle}
                    >
                      {teacher.user?.image ? (
                        <img src={teacher.user.image} alt={teacher.user?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span style={{ color: avatarStyle.color }}>{teacher.user?.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--foreground)] truncate">{teacher.user?.name}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{teacher.username}</p>
                    </div>
                  </div>

                  {teacher.expertise?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.expertise.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md text-xs font-semibold border border-[var(--cyan)]/20 bg-[var(--cyan)]/5 text-[var(--cyan)]">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                    <div>
                      <span className="font-black text-[var(--cyan)]">
                        {!teacher.fees || teacher.fees === 0 ? "Free" : `₹${teacher.fees}`}
                      </span>
                      {teacher.fees > 0 && <span className="text-xs text-[var(--muted)] ml-1">/ session</span>}
                    </div>
                    <Link
                      href="/mentors"
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        availableCount > 0
                          ? "text-white hover:scale-105"
                          : "text-[var(--muted)] bg-[var(--surface-2)] cursor-not-allowed"
                      }`}
                      style={availableCount > 0 ? { background: "linear-gradient(135deg, var(--cyan), var(--accent))" } : {}}
                    >
                      {availableCount > 0 ? `${availableCount} slot${availableCount !== 1 ? "s" : ""} open` : "Fully Booked"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
