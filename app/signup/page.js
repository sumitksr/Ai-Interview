"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ── Toast (matches booking-confirmed style) ───────────────────────────────────
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
          <button
            onClick={toast.onResend}
            disabled={toast.sent}
            className="mt-2 text-xs font-bold underline underline-offset-2 opacity-80 hover:opacity-100 disabled:opacity-50"
          >
            {toast.sent ? "✓ Email sent!" : "Resend verification email"}
          </button>
        )}
      </div>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity text-lg">✕</button>
    </div>
  );
}

export default function Signup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { login } = useAuth();
  const callbackUrl = searchParams.get("callbackUrl");

  const handleCloseToast = useCallback(() => setToast(null), []);

  async function handleResend() {
    setToast(prev => prev ? { ...prev, sent: false, sending: true } : prev);
    try {
      await fetch("/api/v1/user/resend-verification", { method: "POST" });
      setToast(prev => prev ? { ...prev, sent: true, sending: false } : prev);
    } catch {
      setToast(prev => prev ? { ...prev, sending: false } : prev);
    }
  }

  function getRedirectTarget(role) {
    if (callbackUrl && callbackUrl.startsWith("/")) return callbackUrl;
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
    const password = formData.get("password");

    try {
      const res = await fetch("/api/v1/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
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
      // Show verification toast before redirect
      setToast({
        message: "Account created! Check your inbox to verify your email.",
        onResend: handleResend,
        sent: false,
      });
      // Short delay so user sees the toast, then redirect
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
        <p className="text-sm font-semibold uppercase tracking-wide text-hot">
          Join AceAI
        </p>
        <h1 className="title-text mt-3 text-3xl font-black">
          Accelerate Your Career
        </h1>
        <p className="muted-text mt-3">
          Create an account to start practicing and mastering your interview
          skills.
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
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              placeholder="Create a strong password"
              className="input-control mt-2"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-hot w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Creating your account…
              </>
            ) : (
              "Get Started with AceAI →"
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
            Verify to unlock all features like AI interviews and mentor
            booking.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px bg-border flex-1" />
          <span className="text-sm font-semibold text-muted">or</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <OAuthButtons />

        <p className="muted-text mt-6 text-center text-sm">
          Already using AceAI?{" "}
          <Link
            href="/login"
            className="font-semibold text-accent hover:underline"
          >
            Sign in here
          </Link>
        </p>
        <p className="muted-text mt-2 text-center text-sm">
          Are you an expert interviewer?{" "}
          <Link
            href="/signup/teacher"
            className="font-semibold text-cyan hover:underline"
          >
            Apply as a Mentor
          </Link>
        </p>
      </section>

      <section className="tech-card rounded-lg p-6 sm:p-8">
        <p className="text-sm font-semibold text-hot">Why Join AceAI?</p>
        <div className="mt-6 space-y-4">
          {[
            [
              "Smart Feedback Loop",
              "Identify weak points in your delivery and structure instantly.",
            ],
            [
              "Role-Specific Scenarios",
              "Practice with questions customized for your exact target job.",
            ],
            [
              "Continuous Improvement",
              "Track your confidence and technical accuracy over time.",
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

// Separate component to allow dynamic import of next-auth/react
function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = React.useState(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  async function handleOAuth(provider) {
    setLoadingProvider(provider);
    const { signIn } = await import("next-auth/react");
    await signIn(provider, {
      callbackUrl:
        callbackUrl && callbackUrl.startsWith("/")
          ? callbackUrl
          : "/dashboard",
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <button
        id="google-signup-btn"
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={!!loadingProvider}
        className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === "google" ? (
          <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </button>
      <button
        id="github-signup-btn"
        type="button"
        onClick={() => handleOAuth("github")}
        disabled={!!loadingProvider}
        className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === "github" ? (
          <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.022A9.606 9.606 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        )}
        Continue with GitHub
      </button>
    </div>
  );
}
