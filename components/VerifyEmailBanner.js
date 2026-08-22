"use client";

import React, { useState } from "react";

/**
 * VerifyEmailBanner — a dismissible notification banner shown to unverified
 * email-signup users. Not shown for OAuth users (they're auto-verified).
 *
 * Props:
 *   - onDismiss: () => void (optional)
 */
export default function VerifyEmailBanner({ onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (dismissed) return null;

  async function handleResend() {
    setSending(true);
    setError("");
    setSent(false);
    try {
      const res = await fetch("/api/v1/user/resend-verification", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send verification email.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <div className="relative mx-auto max-w-5xl mt-4 px-5 sm:px-8 animate-in fade-in slide-in-from-top-3 duration-500">
      <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 px-5 py-4 shadow-lg shadow-amber-500/5">
        {/* Mail icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-400 mt-0.5 flex-shrink-0"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-300">
            Verify your email for AI Interview
          </p>
          <p className="text-xs text-amber-300/70 mt-1 leading-relaxed">
            Please check your inbox and click the verification link to unlock
            all features — AI interviews, mentor booking, and more.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={handleResend}
              disabled={sending || sent}
              className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending
                ? "Sending…"
                : sent
                ? "✓ Email Sent"
                : "Resend Verification Email"}
            </button>

            {error && (
              <span className="text-xs text-red-400">{error}</span>
            )}
            {sent && (
              <span className="text-xs text-green-400">
                Check your inbox!
              </span>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="text-amber-400/60 hover:text-amber-300 transition-colors flex-shrink-0 p-1"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
