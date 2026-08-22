"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ── Toast ──────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl max-w-sm bg-amber-500/15 border-amber-500/40 text-amber-300">
      <span className="text-lg leading-none mt-0.5">✉️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold leading-snug">{toast.message}</p>
        {toast.onResend && (
          <button onClick={toast.onResend} disabled={toast.sent}
            className="mt-2 text-xs font-bold underline underline-offset-2 opacity-80 hover:opacity-100 disabled:opacity-50">
            {toast.sent ? "✓ Email sent!" : "Resend verification email"}
          </button>
        )}
      </div>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity text-lg">✕</button>
    </div>
  );
}

export default function TeacherSignup() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { login } = useAuth();

  const handleCloseToast = useCallback(() => setToast(null), []);

  async function handleResend() {
    setToast(prev => prev ? { ...prev, sent: false } : prev);
    try {
      await fetch("/api/v1/user/resend-verification", { method: "POST" });
      setToast(prev => prev ? { ...prev, sent: true } : prev);
    } catch {}
  }

  function getRedirectTarget(role) {
    if (role === "teacher") return "/mentor/dashboard";
    if (role === "admin") return "/admin/dashboard";
    return "/dashboard";
  }

  // ── Direct signup (no OTP) ──────────────────────────────────────────────────
  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const username = formData.get("username");
    const fees = formData.get("fees");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/v1/user/signup/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, username, fees, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed.");
        setLoading(false);
        return;
      }

      login({
        name: data.name,
        image: data.image,
        role: data.role,
        isVerified: false,
      });
      setToast({
        message: "Account created! Check your inbox to verify your email.",
        onResend: handleResend,
        sent: false,
      });
      setTimeout(() => router.push(getRedirectTarget(data.role)), 1800);
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Toast toast={toast} onClose={handleCloseToast} />
      <div className="page-shell mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-16">
      <section className="tech-card rounded-lg p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan">
          Teacher Sign up
        </p>
        <h1 className="title-text mt-3 text-3xl font-black">
          Become an Interviewer
        </h1>
        <p className="muted-text mt-3">
          Join our platform to conduct live mock interviews and help
          candidates succeed.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="mt-8 space-y-5">
          <label className="block">
            <span className="soft-text text-sm font-semibold">
              Full name
            </span>
            <input
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="input-control mt-2"
            />
          </label>

          <label className="block">
            <span className="soft-text text-sm font-semibold">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="input-control mt-2"
            />
          </label>

          <label className="block">
            <span className="soft-text text-sm font-semibold">
              Username
            </span>
            <input
              name="username"
              type="text"
              required
              placeholder="e.g. tech_guru_99"
              className="input-control mt-2"
            />
          </label>

          <label className="block">
            <span className="soft-text text-sm font-semibold">
              Hourly Fee (₹)
            </span>
            <input
              name="fees"
              type="number"
              min="0"
              required
              placeholder="e.g. 50"
              className="input-control mt-2"
            />
          </label>

          <label className="block">
            <span className="soft-text text-sm font-semibold">
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              placeholder="Create a password"
              className="input-control mt-2"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Creating your account…
              </>
            ) : (
              "Apply as Teacher →"
            )}
          </button>
        </form>

        {/* Email verification info */}
        <div className="mt-5 flex items-start gap-2 rounded-lg bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 px-4 py-3">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--cyan)] mt-0.5 flex-shrink-0"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <p className="text-xs text-[var(--cyan)] leading-relaxed">
            After signing up, we&apos;ll send a verification link to your email.
            Verify to unlock all features like mentor bookings.
          </p>
        </div>

        <p className="muted-text mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-accent hover:underline"
          >
            Log in
          </Link>
        </p>
        <p className="muted-text mt-2 text-center text-sm">
          Looking to practice interviews?{" "}
          <Link
            href="/signup"
            className="font-semibold text-cyan hover:underline"
          >
            Sign up as a Student
          </Link>
        </p>
      </section>

      <section className="tech-card rounded-lg p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan">Why teach with us?</p>
        <div className="mt-6 space-y-4">
          {[
            [
              "Set your own schedule",
              "Conduct interviews whenever you are available, right from your dashboard.",
            ],
            [
              "Earn competitive rates",
              "You set your own hourly fee and keep the majority of your earnings.",
            ],
            [
              "Help candidates succeed",
              "Provide valuable feedback and guide the next generation of professionals.",
            ],
          ].map(([title, text]) => (
            <div key={title} className="tech-card-subtle rounded-lg p-5">
              <p className="font-bold">{title}</p>
              <p className="muted-text mt-2 text-sm leading-6">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
    </>
  );
}
