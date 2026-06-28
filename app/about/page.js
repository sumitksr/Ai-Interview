import React from "react";
import Link from "next/link";

/* ─── Data ───────────────────────────────────────────────────────────────── */
const STATS = [
  { value: "10k+", label: "Professionals coached", color: "var(--accent)" },
  { value: "95%",  label: "Satisfaction rate",     color: "var(--cyan)" },
  { value: "50+",  label: "Roles covered",          color: "var(--hot)" },
  { value: "24/7", label: "AI always available",    color: "var(--emerald)" },
];

const PILLARS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    color: "var(--accent)",
    title: "Built for Real Interviews",
    text: "Our AI is trained on thousands of real interview transcripts from top tech, finance, and consulting firms — so every session feels authentic.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
    ),
    color: "var(--cyan)",
    title: "Instant, Honest Feedback",
    text: "No generic tips. Ace AI gives precise, actionable feedback on each answer — covering structure, depth, confidence, and alignment.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    color: "var(--hot)",
    title: "Track Your Progress",
    text: "Watch your scores improve session by session. Visual analytics show exactly where you've grown and what still needs work.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>
      </svg>
    ),
    color: "var(--accent)",
    title: "Resume Synergy",
    text: "Ace AI connects your resume to your answers — surfacing relevant experience you might forget to mention under pressure.",
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
    color: "var(--cyan)",
    title: "Expert Human Mentors",
    text: "Book 1-on-1 coaching with engineers and PMs from top companies. AI gets you ready; our mentors make you exceptional.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/>
        <path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
      </svg>
    ),
    color: "var(--hot)",
    title: "Role-Specific AI",
    text: "Whether it's a SWE system design round or a PM product sense interview, Ace AI adapts its questions, scoring, and feedback to your exact target role.",
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function About() {
  return (
    <div className="page-shell">

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background glows */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(45,212,191,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute", bottom: 0, right: 0, width: 400, height: 400,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)",
            filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 pt-24 pb-20 text-center">
          <span className="accent-pill mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse inline-block" />
            About Ace AI
          </span>

          <h1
            className="title-text font-black tracking-tight leading-[1.08]"
            style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}
          >
            We believe preparation{" "}
            <span className="gradient-text">changes everything</span>
          </h1>

          <p className="soft-text mt-6 text-lg leading-8 max-w-2xl mx-auto">
            Ace AI was built on a simple truth: the best candidates aren&apos;t always the ones who get hired — the <strong className="title-text">best-prepared</strong> ones are. Our mission is to give every professional access to elite-level interview coaching, powered by AI.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/signup" className="btn-primary px-8 py-3.5 rounded-xl text-base">
              Start Practising Free →
            </Link>
            <Link href="/contact" className="btn-secondary px-8 py-3.5 rounded-xl text-base">
              Talk to Us
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════════════════ */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label, color }) => (
              <div key={label} className="group">
                <p
                  className="text-4xl font-black leading-none transition-all duration-300 group-hover:scale-110"
                  style={{ color }}
                >
                  {value}
                </p>
                <p className="muted-text text-sm mt-2 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MISSION
      ══════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-14 lg:items-center">
          <div>
            <span className="accent-pill mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
              Our Mission
            </span>
            <h2 className="title-text text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Democratising{" "}
              <span className="gradient-text">elite prep</span>{" "}
              for everyone
            </h2>
            <p className="soft-text mt-5 text-base leading-8">
              Top companies hire from a tiny pool of candidates — not because others aren&apos;t qualified, but because they didn&apos;t have access to the right preparation resources. Expensive coaching, insider networks, and luck shouldn&apos;t determine your career.
            </p>
            <p className="soft-text mt-4 text-base leading-8">
              We combine cutting-edge language models with behavioural science research to deliver feedback that is not just accurate — it&apos;s genuinely transformative.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {[
                "AI trained on real interview transcripts",
                "Instant STAR-method scoring on every answer",
                "Personalised improvement plans after every session",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md grid place-items-center flex-shrink-0"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span className="soft-text text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual card */}
          <div
            className="glass-card rounded-3xl p-8 flex flex-col gap-6"
          >
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Clarity", score: "92", color: "var(--accent)" },
                { label: "Depth", score: "87", color: "var(--cyan)" },
                { label: "Confidence", score: "89", color: "var(--hot)" },
              ].map(({ label, score, color }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4 text-center"
                  style={{ background: `${color}12`, border: `1px solid ${color}30` }}
                >
                  <p className="text-3xl font-black" style={{ color }}>{score}</p>
                  <p className="muted-text text-xs mt-1 font-semibold">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--accent-soft)", border: "1px solid var(--border)" }}>
              <p className="font-bold" style={{ color: "var(--accent)" }}>Ace AI  </p>
              <p className="muted-text text-xs mt-1 leading-5">
                Your STAR structure was strong — but your impact metrics were vague. Next time, quantify the outcome: "reduced load time by 40%" beats "improved performance".
              </p>
            </div>

            <div className="rounded-xl px-4 py-3" style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}>
              <p className="muted-text font-bold text-xs">You</p>
              <p className="soft-text text-sm mt-1">
                During the migration I led the backend team to reduce API response times while keeping zero downtime…
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHAT MAKES ACE AI DIFFERENT
      ══════════════════════════════════════════════════════ */}
      <section
        className="mx-auto max-w-7xl px-5 sm:px-8 py-20"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="text-center mb-14">
          <span className="accent-pill mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
            Why Ace AI
          </span>
          <h2 className="title-text text-4xl sm:text-5xl font-black tracking-tight">
            What makes us{" "}
            <span className="gradient-text">different</span>
          </h2>
          <p className="soft-text mt-4 max-w-xl mx-auto text-base leading-7">
            We didn&apos;t build a chatbot. We built an interview coach that actually holds you accountable and helps you grow.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(({ icon, color, title, text }) => (
            <div
              key={title}
              className="tech-card rounded-2xl p-6 flex flex-col gap-4 group"
            >
              <div
                className="w-12 h-12 rounded-xl grid place-items-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: `color-mix(in srgb, ${color} 15%, var(--surface-2))`,
                  border: `1px solid color-mix(in srgb, ${color} 35%, var(--border))`,
                  color,
                }}
              >
                {icon}
              </div>
              <div>
                <h3 className="title-text text-base font-black">{title}</h3>
                <p className="muted-text mt-2 text-sm leading-6">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          VALUES STRIP
      ══════════════════════════════════════════════════════ */}
      <section
        className="mx-auto max-w-7xl px-5 sm:px-8 py-16"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="rounded-3xl p-8 sm:p-12"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(56,189,248,0.05) 50%, rgba(249,115,22,0.05) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-center mb-10">
            <h2 className="title-text text-3xl font-black">
              Our core <span className="gradient-text">values</span>
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: "🎯", label: "Radical Honesty", text: "We give you the feedback you need, not the feedback you want to hear. Growth requires truth.", color: "var(--accent)" },
              { icon: "⚡", label: "Always Improving", text: "Our AI gets smarter with every session. We never stop iterating on our models and methods.", color: "var(--cyan)" },
              { icon: "🌍", label: "Accessible to All", text: "No expensive boot camps. No insider networks. Elite prep should be available to everyone.", color: "var(--hot)" },
            ].map(({ icon, label, text, color }) => (
              <div key={label} className="text-center group">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 grid place-items-center text-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                >
                  {icon}
                </div>
                <h3 className="title-text font-black text-base">{label}</h3>
                <p className="muted-text text-sm mt-2 leading-6 max-w-xs mx-auto">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-24">
        <div
          className="rounded-3xl px-8 py-16 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(10,28,28,0.98) 0%, rgba(8,18,32,0.98) 50%, rgba(10,28,24,0.98) 100%)",
            border: "1px solid color-mix(in srgb, var(--accent) 40%, var(--border))",
            boxShadow: "0 0 80px var(--accent-glow)",
          }}
        >
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
              Ready to start?
            </span>
            <h2
              className="title-text font-black tracking-tight max-w-2xl mx-auto"
              style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.1 }}
            >
              Your next offer starts with one mock interview
            </h2>
            <p className="soft-text mt-5 text-lg max-w-lg mx-auto leading-7">
              Join thousands of professionals who used Ace AI to walk into their real interviews with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href="/signup" className="btn-primary px-9 py-3.5 text-base rounded-xl">
                Start Free Today →
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
