import React from "react";
import Link from "next/link";

const pillars = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    iconClass: "",
    title: "Built for Real Interviews",
    text: "Our AI is trained on thousands of real interview transcripts from top tech, finance, and consulting firms — so every session feels authentic.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
    ),
    iconClass: "emerald",
    title: "Instant, Honest Feedback",
    text: "No generic tips. Ace AI gives you precise, actionable feedback on each answer — covering structure, depth, confidence, and alignment.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    iconClass: "hot",
    title: "Track Your Progress",
    text: "Watch your scores improve session by session. Visual analytics show exactly where you've grown and what still needs work.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3z"/>
      </svg>
    ),
    iconClass: "",
    title: "Resume Synergy",
    text: "Ace AI connects your resume to your answers — surfacing relevant experience you might forget to mention under pressure.",
  },
];

export default function About() {
  return (
    <div className="page-shell">

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="hero-orb-1" style={{ opacity: 0.7 }} />
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">

          <div>
            <p className="accent-pill mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              About Ace AI
            </p>
            <h1 className="title-text text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              We believe preparation{" "}
              <span className="gradient-text">changes everything</span>
            </h1>
            <p className="soft-text mt-6 text-lg leading-8">
              Ace AI was built on a simple truth: the best candidates aren&apos;t always the ones who get hired — the best-prepared ones are. Our mission is to give every professional access to elite-level interview coaching, powered by AI and backed by real industry expertise.
            </p>
            <p className="soft-text mt-4 text-lg leading-8">
              We combine cutting-edge language models with behavioural science research to deliver feedback that is not just accurate — it&apos;s genuinely transformative.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary px-7 py-3 rounded-xl">
                Start Practising Free →
              </Link>
              <Link href="/contact" className="btn-secondary px-7 py-3 rounded-xl">
                Talk to Us
              </Link>
            </div>
          </div>

          {/* Stats block */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "50+", label: "Industry roles covered", color: "var(--accent)" },
              { value: "95%", label: "Interview success rate", color: "var(--emerald)" },
              { value: "24/7", label: "Always-on AI coaching", color: "var(--hot)" },
              { value: "10k+", label: "Professionals coached", color: "var(--cyan)" },
            ].map(({ value, label, color }) => (
              <div
                key={label}
                className="rounded-2xl p-6 flex flex-col justify-between transition-all duration-260 hover:-translate-y-1"
                style={{
                  background: `${color}10`,
                  border: `1px solid ${color}30`,
                }}
              >
                <p className="text-3xl font-black" style={{ color }}>{value}</p>
                <p className="muted-text text-sm mt-3 font-medium leading-5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUE PILLARS ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="text-center mb-12">
          <h2 className="title-text text-3xl font-black sm:text-4xl">
            What makes Ace AI{" "}
            <span className="gradient-text">different</span>
          </h2>
          <p className="soft-text mt-3 text-base max-w-lg mx-auto">
            We didn&apos;t build a chatbot. We built an interview coach that actually holds you accountable.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {pillars.map(({ icon, iconClass, title, text }) => (
            <article key={title} className="tech-card rounded-2xl p-6 flex gap-5">
              <div className={`feature-icon ${iconClass} flex-shrink-0 mt-0.5`}>{icon}</div>
              <div>
                <h2 className="title-text text-base font-bold">{title}</h2>
                <p className="muted-text mt-2 text-sm leading-6">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── MISSION STRIP ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div
          className="rounded-2xl p-8 sm:p-12"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.1), rgba(56,189,248,0.06))",
            border: "1px solid var(--border)",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                value: "1",
                label: "Unified Platform",
                text: "Resume review, mock interviews, analytics, and mentors — all under one roof.",
                color: "var(--hot)",
              },
              {
                value: "24/7",
                label: "Always Ready",
                text: "Practice at midnight before a morning interview. Ace AI never sleeps.",
                color: "var(--accent)",
              },
              {
                value: "100%",
                label: "Growth Focused",
                text: "Every piece of feedback is designed to make you meaningfully better — not just feel better.",
                color: "var(--emerald)",
              },
            ].map(({ value, label, text, color }) => (
              <div key={label} className="text-center">
                <p className="text-4xl font-black" style={{ color }}>{value}</p>
                <p className="title-text mt-3 text-base font-bold">{label}</p>
                <p className="muted-text mt-2 text-sm leading-6">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
