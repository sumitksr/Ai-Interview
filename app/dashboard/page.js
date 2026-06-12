"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/v1/dashboard");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="page-shell mx-auto max-w-7xl px-5 py-20 flex flex-col justify-center items-center h-[60vh]">
        <div className="relative flex items-center justify-center">
          <div className="absolute animate-ping w-16 h-16 rounded-full bg-[var(--cyan)]/20"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-[var(--cyan)]"></div>
        </div>
        <p className="mt-6 text-[var(--muted)] font-medium animate-pulse">Loading your analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  const { user, userData } = data;
  const recentInterviews = userData?.interviewHistory || [];

  if (recentInterviews.length === 0) {
    return (
      <div className="page-shell mx-auto max-w-7xl px-5 py-20 sm:px-8 text-center flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--cyan)]/10 rounded-full blur-[100px] -z-10"></div>
        
        <div className="relative bg-[var(--surface)]/40 backdrop-blur-xl border border-[var(--border)]/50 rounded-3xl p-12 max-w-3xl shadow-2xl transition-all duration-500 hover:shadow-[var(--accent)]/10">
          <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-[var(--cyan)] to-[var(--accent)] rounded-2xl flex items-center justify-center mb-8 shadow-lg transform -rotate-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
          </div>
          <h1 className="title-text text-5xl font-black mb-4 tracking-tight">Welcome, {user?.name}!</h1>
          <p className="muted-text text-xl mb-10 leading-relaxed">
            You haven't taken any interviews yet. Complete your first practice session to unlock personalized performance analysis, score tracking, and AI-tailored feedback.
          </p>
          <Link href="/signup" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)] rounded-2xl hover:scale-105 shadow-xl hover:shadow-[var(--cyan)]/25">
            <span className="mr-2">Start Your First Interview</span>
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
          </Link>
        </div>
      </div>
    );
  }

  // Format data for chart
  const chartData = recentInterviews.map((interview, index) => ({
    name: `Session ${index + 1}`,
    score: interview.score || 0,
    date: new Date(interview.date).toLocaleDateString(),
  }));

  const latestInterview = recentInterviews[recentInterviews.length - 1];
  const scoreChange = recentInterviews.length > 1 
    ? (recentInterviews[recentInterviews.length - 1].score - recentInterviews[recentInterviews.length - 2].score)
    : 0;

  return (
    <div className="page-shell mx-auto max-w-7xl px-5 py-12 sm:px-8 relative">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--cyan)]/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      
      {/* Header Section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse"></span>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--cyan)]">Candidate Workspace</p>
          </div>
          <h1 className="title-text text-4xl sm:text-5xl font-black tracking-tight">Dashboard</h1>
          <p className="muted-text mt-3 max-w-2xl text-lg">
            Review your interview performance, track your scores, and analyze your AI feedback.
          </p>
        </div>
        <Link href="/signup" className="btn-primary whitespace-nowrap shadow-lg shadow-[var(--cyan)]/20 hover:shadow-[var(--cyan)]/40 transition-all">
          New session <span className="ml-1">→</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <section className="grid gap-6 md:grid-cols-3 mb-10">
        <article className="tech-card rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
          </div>
          <p className="soft-text text-sm font-semibold uppercase tracking-wider mb-2">Sessions Taken</p>
          <div className="flex items-baseline gap-3">
            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)]">{userData?.interviewsTaken || 0}</p>
            <p className="text-sm text-[var(--accent)] font-medium">All time</p>
          </div>
        </article>

        <article className="tech-card rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m16 10-4 4-4-4"/></svg>
          </div>
          <p className="soft-text text-sm font-semibold uppercase tracking-wider mb-2">Average Score</p>
          <div className="flex items-baseline gap-3">
            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)]">{userData?.averageScore || 0}<span className="text-3xl">%</span></p>
            <p className="text-sm text-[var(--cyan)] font-medium">Overall</p>
          </div>
        </article>

        <article className="tech-card rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <p className="soft-text text-sm font-semibold uppercase tracking-wider mb-2">Recent Trend</p>
          <div className="flex items-baseline gap-3">
            <p className="text-5xl font-black text-[var(--foreground)]">
              {scoreChange > 0 ? `+${scoreChange}` : scoreChange}
            </p>
            <p className={`text-sm font-medium ${scoreChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              vs last session
            </p>
          </div>
        </article>
      </section>

      {/* Charts and Details Section */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        
        {/* Chart Container */}
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 shadow-xl">
          <div className="mb-8">
            <h2 className="title-text text-2xl font-bold">Performance Timeline</h2>
            <p className="muted-text mt-1 text-sm">Your interview scores over time.</p>
          </div>
          <div className="h-[300px] w-full">
            {typeof window !== 'undefined' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: 'var(--cyan)', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--muted)', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--cyan)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Latest Question Review Container */}
        <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-6 shadow-xl flex flex-col h-[420px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="title-text text-2xl font-bold">Latest Review</h2>
              <p className="muted-text mt-1 text-sm">Feedback from your last session.</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--muted)]">
                {new Date(latestInterview?.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-3 pb-2 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
            {latestInterview?.questions?.map((q, idx) => {
              const hasMistake = q.mistake && q.mistake.toLowerCase() !== "none." && q.mistake.toLowerCase() !== "none";
              return (
                <div key={idx} className={`relative p-5 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
                  hasMistake 
                  ? 'border-red-500/20 bg-red-500-[0.02] hover:border-red-500/40' 
                  : 'border-emerald-500/20 bg-emerald-500-[0.02] hover:border-emerald-500/40'
                }`}>
                  {/* Indicator Dot */}
                  <div className={`absolute top-5 right-5 w-2 h-2 rounded-full ${hasMistake ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}></div>
                  
                  <p className="font-bold text-[var(--foreground)] mb-2 pr-6">Q: {q.question}</p>
                  <p className="text-[var(--muted)] text-sm mb-4 leading-relaxed">A: {q.answer}</p>
                  
                  {hasMistake ? (
                    <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                        <p className="text-red-400 text-xs font-black uppercase tracking-wider">Mistake Identified</p>
                      </div>
                      <p className="text-sm text-red-200/90 mb-3">{q.mistake}</p>
                      
                      <div className="flex items-center gap-2 mb-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        <p className="text-[var(--cyan)] text-xs font-black uppercase tracking-wider">How to improve</p>
                      </div>
                      <p className="text-sm text-[var(--cyan)]/90">{q.feedback}</p>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                        <p className="text-emerald-400 text-xs font-black uppercase tracking-wider">Excellent Answer</p>
                      </div>
                      <p className="text-sm text-emerald-200/90">{q.feedback}</p>
                    </div>
                  )}
                </div>
              );
            }) || (
              <div className="flex flex-col items-center justify-center h-full opacity-50 py-10">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                <p className="muted-text text-sm text-center">No specific questions recorded for the last interview.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
