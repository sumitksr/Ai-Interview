import React from "react";

const contactInfo = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
    label: "Email Support",
    value: "help@aceai.dev",
    sub: "We reply within 1 business day",
    color: "var(--accent)",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: "Response Time",
    value: "< 24 hours",
    sub: "Monday to Friday, 9am – 6pm IST",
    color: "var(--emerald)",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
      </svg>
    ),
    label: "Best For",
    value: "Tech, Data & PM roles",
    sub: "Engineering, design, operations & finance",
    color: "var(--hot)",
  },
];

export default function Contact() {
  async function handleSubmit(formData) {
    "use server";
    const name = formData.get("name");
    const email = formData.get("email");
    const subject = formData.get("subject");
    const message = formData.get("message");
    console.log({ name, email, subject, message });
  }

  return (
    <div className="page-shell mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
      <div className="hero-orb-2" style={{ opacity: 0.5 }} />

      {/* Page header */}
      <div className="mb-12 text-center">
        <p className="accent-pill mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          Get In Touch
        </p>
        <h1 className="title-text text-4xl font-black tracking-tight sm:text-5xl">
          We&apos;d love to{" "}
          <span className="gradient-text">hear from you</span>
        </h1>
        <p className="soft-text mt-4 mx-auto max-w-lg text-lg leading-7">
          Got a question, feature request, or just want to share how your interview went? Drop us a message — we&apos;re always listening.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">

        {/* Left column — info */}
        <div className="flex flex-col gap-4">
          {contactInfo.map(({ icon, label, value, sub, color }) => (
            <div
              key={label}
              className="rounded-2xl p-5 flex gap-4 items-start transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: `${color}0d`,
                border: `1px solid ${color}30`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0"
                style={{ background: `${color}18`, color }}
              >
                {icon}
              </div>
              <div>
                <p className="muted-text text-xs font-semibold uppercase tracking-wide">{label}</p>
                <p className="title-text mt-1 font-bold text-sm">{value}</p>
                <p className="muted-text text-xs mt-0.5">{sub}</p>
              </div>
            </div>
          ))}

          {/* Extra nudge */}
          <div
            className="rounded-2xl p-5 mt-2"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(52,211,153,0.07))",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            <p className="title-text text-sm font-bold">Want to jump straight in?</p>
            <p className="muted-text text-xs mt-1 leading-5">
              Start a free AI mock interview right now — no sign-up friction, no credit card.
            </p>
            <a
              href="/signup"
              className="btn-primary mt-4 inline-flex text-sm py-2.5 px-5 rounded-xl min-h-0"
            >
              Try Ace AI Free →
            </a>
          </div>
        </div>

        {/* Right column — form */}
        <form
          action={handleSubmit}
          className="glass-card rounded-2xl p-7 sm:p-9 flex flex-col gap-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="soft-text text-sm font-semibold">Your Name</span>
              <input
                name="name"
                type="text"
                required
                placeholder="Arjun Mehta"
                className="input-control mt-2"
                id="contact-name"
              />
            </label>
            <label className="block">
              <span className="soft-text text-sm font-semibold">Email Address</span>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="input-control mt-2"
                id="contact-email"
              />
            </label>
          </div>

          <label className="block">
            <span className="soft-text text-sm font-semibold">Subject</span>
            <select name="subject" className="input-control mt-2" id="contact-subject">
              <option value="">What is this about?</option>
              <option value="interview-prep">Interview preparation question</option>
              <option value="resume">Resume review help</option>
              <option value="mentor">Finding a mentor</option>
              <option value="bug">Reporting a bug</option>
              <option value="feature">Feature request</option>
              <option value="other">Something else</option>
            </select>
          </label>

          <label className="block">
            <span className="soft-text text-sm font-semibold">Message</span>
            <textarea
              name="message"
              required
              rows={6}
              placeholder="Tell us what role you're preparing for, or what's on your mind..."
              className="input-control mt-2 resize-none"
              id="contact-message"
            />
          </label>

          <button
            type="submit"
            id="contact-submit"
            className="btn-primary self-start px-8 py-3 rounded-xl text-sm font-bold"
          >
            Send Message →
          </button>
        </form>
      </div>
    </div>
  );
}
