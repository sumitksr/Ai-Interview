"use client";

import React, { useEffect } from "react";
import Link from "next/link";

/* ─── Static data ────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/>
        <path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
      </svg>
    ),
    color: "var(--accent)",
    title: "AI Mock Interviews",
    text: "Role-specific conversations that mirror real hiring panels. Every answer is scored on structure, depth and confidence — then you get a rewritten example in seconds.",
    badge: "Most Popular",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>
      </svg>
    ),
    color: "var(--cyan)",
    title: "Resume Intelligence",
    text: "Upload your resume and the job description. Ace AI rewrites bullet points, fills keyword gaps, and quantifies achievements to beat ATS and impress reviewers.",
    badge: "New",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10"/>
        <line x1="12" x2="12" y1="20" y2="4"/>
        <line x1="6" x2="6" y1="20" y2="14"/>
      </svg>
    ),
    color: "var(--hot)",
    title: "Performance Analytics",
    text: "Track clarity, pacing, and confidence across every session. Your personalised dashboard shows exactly what's improving — and what still needs work.",
    badge: null,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: "var(--accent)",
    title: "Expert Mentors",
    text: "Book 1-on-1 coaching with engineers and PMs from Google, Amazon, and top startups. Target your exact weak spots before the real interview.",
    badge: null,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Set up your profile",
    text: "Tell Ace AI your target role, company, and experience level. It tailors every question to match real hiring standards.",
  },
  {
    n: "02",
    title: "Run a mock interview",
    text: "Have a live back-and-forth conversation. Ace AI follows up, challenges vague answers, and keeps the pressure realistic.",
  },
  {
    n: "03",
    title: "Get your scorecard",
    text: "Receive a detailed breakdown with scores, better answer examples, and a prioritised improvement plan.",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    initials: "PS",
    text: "Ace AI flagged that I was overusing filler words and my STAR answers lacked specific timelines. I fixed both — and got the offer.",
    stars: 5,
    color: "var(--accent)",
  },
  {
    name: "Arjun Mehta",
    initials: "AM",
    text: "The resume intelligence feature surfaced 3 skills I had but wasn't highlighting. My callback rate jumped from 15% to 60% in two weeks.",
    stars: 5,
    color: "var(--cyan)",
  },
  {
    name: "Sara Kim",
    initials: "SK",
    text: "50+ mock PM interviews with Ace AI. By the time I sat in my real interviews I was calm, structured, and completely confident.",
    stars: 5,
    color: "var(--hot)",
  },
];

export default function Home() {
  

  return (
    <div className="page-shell">

      {/* ─────────────────────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────────────────────── */}
      <section className="relative">
        {/* Background glow */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(45,212,191,0.15) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 lg:gap-16 lg:items-center gap-12">

            {/* ── Left: headline & CTAs ── */}
            <div>
              <span className="accent-pill mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse inline-block" />
                AI-Powered Interview Coaching
              </span>

              <h1 className="title-text font-black tracking-tight leading-[1.05]" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)" }}>
                Stop guessing.<br />
                Start <span className="gradient-text">acing</span> every interview.
              </h1>

              <p className="soft-text mt-6 text-lg leading-8 max-w-lg">
                Ace AI runs realistic mock interviews, scores every answer instantly, and rewrites your resume to match any job description — so you walk in fully prepared.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className="btn-primary px-7 py-3.5 rounded-xl text-base">
                  Start Free →
                </Link>
                <Link href="/about" className="btn-secondary px-7 py-3.5 rounded-xl text-base">
                  See How It Works
                </Link>
              </div>

              {/* Stats row */}
              <div className="mt-10 flex flex-wrap gap-8 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
                {[
                  { v: "10k+", l: "Professionals coached" },
                  { v: "95%", l: "Satisfaction rate" },
                  { v: "24/7", l: "AI available" },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <p className="stat-number">{v}</p>
                    <p className="muted-text text-xs mt-1 font-medium">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: mock interview terminal card ── */}
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                  Live Session · Senior Software Engineer
                </span>
                <span className="ml-auto hot-pill text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                  ● Live
                </span>
              </div>

              {/* Chat body */}
              <div className="px-5 py-5 flex flex-col gap-3 font-mono text-sm">
                {/* AI question */}
                <div className="console-line rounded-lg px-4 py-3">
                  <span className="font-bold" style={{ color: "var(--accent)" }}>Ace AI  </span>
                  Describe a time you led a project under a tight deadline.
                </div>

                {/* User answer */}
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}>
                  <span className="muted-text font-bold">You  </span>
                  <span className="soft-text">During my internship, I coordinated 4 teams to ship a payment module 3 weeks early by...</span>
                </div>

                {/* Analysis */}
                <div className="rounded-lg px-4 py-2.5 text-xs" style={{ background: "var(--accent-soft)", border: "1px solid var(--border)" }}>
                  <span className="font-bold" style={{ color: "var(--accent)" }}>Analysing  </span>
                  <span className="muted-text">Checking STAR structure · Scoring depth · Generating feedback…</span>
                </div>
              </div>

              {/* Score strip */}
              <div className="grid grid-cols-3" style={{ borderTop: "1px solid var(--border)" }}>
                {[
                  { label: "Clarity", score: "92", note: "Excellent" },
                  { label: "Depth", score: "81", note: "Good" },
                  { label: "Confidence", score: "87", note: "Strong" },
                ].map(({ label, score, note }, i) => (
                  <div
                    key={label}
                    className="py-4 text-center"
                    style={{ borderRight: i < 2 ? "1px solid var(--border)" : "none" }}
                  >
                    <p className="muted-text text-xs mb-1">{label}</p>
                    <p className="gradient-text font-black text-2xl leading-none">{score}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: "var(--emerald)" }}>{note}</p>
                  </div>
                ))}
              </div>

              {/* Waveform */}
              <div
                className="flex items-end gap-1 px-5 py-4"
                style={{ borderTop: "1px solid var(--border)", height: "4.5rem" }}
              >
                {[35, 55, 42, 70, 50, 85, 60, 95, 72, 88, 65, 78, 48, 68, 55, 80].map((h, i) => (
                  <span
                    key={i}
                    className="signal-bar rounded-t flex-1"
                    style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FEATURES — 2×2 grid
      ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
        <div className="text-center mb-14">
          <span className="accent-pill mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
            Every tool you need
          </span>
          <h2 className="title-text text-4xl font-black tracking-tight sm:text-5xl">
            One platform. Every edge.
          </h2>
          <p className="soft-text mt-4 max-w-lg mx-auto text-base leading-7">
            From your first practice session to final-round prep — Ace AI covers every stage of your interview journey.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon, color, title, text, badge }) => (
            <div
              key={title}
              className="tech-card rounded-2xl p-7 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="w-12 h-12 rounded-xl grid place-items-center flex-shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${color} 15%, var(--surface-2))`,
                    border: `1px solid color-mix(in srgb, ${color} 35%, var(--border))`,
                    color,
                  }}
                >
                  {icon}
                </div>
                {badge && (
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: `color-mix(in srgb, ${color} 15%, var(--surface-2))`,
                      border: `1px solid color-mix(in srgb, ${color} 35%, var(--border))`,
                      color,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <div>
                <h3 className="title-text text-lg font-black">{title}</h3>
                <p className="muted-text mt-2 text-sm leading-7">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────────────────────────── */}
      <section
        className="mx-auto max-w-7xl px-5 sm:px-8 py-16"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="grid lg:grid-cols-2 gap-14 lg:items-start">
          <div>
            <span className="accent-pill mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
              Simple process
            </span>
            <h2 className="title-text text-4xl font-black tracking-tight sm:text-5xl">
              Interview-ready in <span className="gradient-text">3 steps</span>
            </h2>
            <p className="soft-text mt-5 text-base leading-7">
              No complicated setup. Sign up, pick your role, and start practising in under 2 minutes.
            </p>
            <div className="mt-10 flex flex-col gap-8">
              {STEPS.map(({ n, title, text }, idx) => (
                <div key={n} className="flex gap-5">
                  <div
                    className="w-10 h-10 rounded-xl grid place-items-center font-black text-sm flex-shrink-0 mt-0.5"
                    style={{
                      background: "var(--accent-soft)",
                      border: "1px solid color-mix(in srgb, var(--accent) 40%, var(--border))",
                      color: "var(--accent)",
                    }}
                  >
                    {n}
                  </div>
                  <div>
                    <p className="title-text font-bold text-base">{title}</p>
                    <p className="muted-text mt-1.5 text-sm leading-6">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link href="/signup" className="btn-primary px-7 py-3 rounded-xl">
                Get Started Free →
              </Link>
            </div>
          </div>

          {/* Checklist card */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="title-text font-black text-base">What's included in Ace AI</p>
              <p className="muted-text text-xs mt-1">Free plan · No card required</p>
            </div>
            <div className="px-6 py-6 flex flex-col gap-4">
              {[
                "Unlimited AI mock interviews",
                "Role-specific question banks (50+ roles)",
                "Real-time STAR method scoring",
                "Resume keyword optimisation",
                "Confidence & pacing analysis",
                "Detailed per-session scorecards",
                "Expert mentor sessions",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md grid place-items-center flex-shrink-0"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span className="soft-text text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div
              className="px-6 py-4"
              style={{ borderTop: "1px solid var(--border)", background: "var(--accent-soft)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                ✦ Upgrade to Pro for unlimited sessions + priority mentor access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          TESTIMONIALS
      ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="text-center mb-14">
          <h2 className="title-text text-4xl font-black tracking-tight sm:text-5xl">
            Real people, real <span className="gradient-text">offers</span>
          </h2>
          <p className="soft-text mt-3 text-base">From candidates who prepared with Ace AI and landed the job.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map(({ name, initials, text, stars, color }) => (
            <div key={name} className="testimonial-card flex flex-col justify-between gap-5">
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: stars }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={color} stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p className="soft-text text-sm leading-7 flex-1">"{text}"</p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <div
                  className="w-9 h-9 rounded-full grid place-items-center text-sm font-bold flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${color} 20%, var(--surface-3))`, color }}
                >
                  {initials}
                </div>
                <div>
                  <p className="title-text text-sm font-bold">{name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CTA BANNER
      ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-24">
        <div
          className="rounded-3xl px-8 py-16 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(10,28,28,0.98) 0%, rgba(8,18,32,0.98) 50%, rgba(10,28,24,0.98) 100%)",
            border: "1px solid color-mix(in srgb, var(--accent) 40%, var(--border))",
            boxShadow: "0 0 80px var(--accent-glow)",
          }}
        >
          {/* Glow overlay */}
          <div
            aria-hidden
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse 65% 45% at 50% 0%, var(--accent-soft), transparent 70%)",
            }}
          />

          <div className="relative">
            <span className="accent-pill mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse inline-block" />
              Join 10,000+ professionals
            </span>

            <h2
              className="title-text font-black tracking-tight max-w-2xl mx-auto"
              style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.1 }}
            >
              Ready to ace your next interview?
            </h2>

            <p className="soft-text mt-5 text-lg max-w-lg mx-auto leading-7">
              Start your first AI mock interview today — completely free. No credit card required.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href="/signup" className="btn-primary px-9 py-3.5 text-base rounded-xl">
                Start Practising Free →
              </Link>
              <Link href="/mentors" className="btn-secondary px-9 py-3.5 text-base rounded-xl">
                Browse Mentors
              </Link>
            </div>

            <p className="muted-text text-xs mt-6">No credit card · Free forever plan · Cancel any time</p>
          </div>
        </div>
      </section>
    </div>
  );
}
