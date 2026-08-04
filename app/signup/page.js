"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Signup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const callbackUrl = searchParams.get("callbackUrl");

  // Step 1 = signup form, Step 2 = OTP verification
  const [step, setStep] = useState(1);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingFormData, setPendingFormData] = useState(null); // store for resend
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const otpRefs = useRef([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  function getRedirectTarget(role) {
    if (callbackUrl && callbackUrl.startsWith("/")) return callbackUrl;
    if (role === "teacher") return "/mentor/dashboard";
    if (role === "admin") return "/admin/dashboard";
    return "/dashboard";
  }

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const targetRole = formData.get("targetRole");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/v1/user/signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, targetRole, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP.");
        setLoading(false);
        return;
      }

      setPendingEmail(email);
      setPendingFormData({ name, email, targetRole, password }); // save for resend
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(30);
      setStep(2);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP and complete signup ────────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/v1/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, otp: otpValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
        setLoading(false);
        return;
      }

      login({ name: data.name, image: data.image, role: data.role });
      router.push(getRedirectTarget(data.role));
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  // ── Resend: call API again without leaving the OTP page ──────────────────
  async function handleResend() {
    if (resendCooldown > 0 || !pendingFormData) return;
    setError("");
    setResendSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/user/signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingFormData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend OTP.");
      } else {
        setOtp(["", "", "", "", "", ""]);
        setResendCooldown(30);
        setResendSuccess(true);
        // Focus first OTP box
        otpRefs.current[0]?.focus();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // OTP box keyboard navigation
  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newOtp = Array(6).fill("");
    pasted.split("").forEach((ch, i) => {
      newOtp[i] = ch;
    });
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="page-shell mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-16">
      <section className="tech-card rounded-lg p-6 sm:p-8">
        {step === 1 ? (
          <>
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

            <form onSubmit={handleSendOtp} className="mt-8 space-y-5">
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
                  Target role
                </span>
                <select
                  name="targetRole"
                  required
                  defaultValue=""
                  className="input-control mt-2"
                >
                  <option value="" disabled>
                    Select your desired role
                  </option>
                  <option>Software Engineer</option>
                  <option>Data Scientist</option>
                  <option>Product Manager</option>
                  <option>UI/UX Designer</option>
                  <option>Marketing Specialist</option>
                </select>
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
                    Sending verification code…
                  </>
                ) : (
                  "Get Started with AceAI →"
                )}
              </button>
            </form>

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
          </>
        ) : (
          <>
            {/* ── OTP Verification Step ── */}
            <button
              onClick={() => {
                setStep(1);
                setError("");
                setOtp(["", "", "", "", "", ""]);
              }}
              className="flex items-center gap-1.5 text-sm muted-text hover:text-accent transition-colors mb-6"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </button>

            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 mb-5">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>

            <h1 className="title-text text-2xl font-black">
              Check your email
            </h1>
            <p className="muted-text mt-2 text-sm leading-relaxed">
              We sent a 6-digit verification code to{" "}
              <span className="font-semibold text-accent">{pendingEmail}</span>.
              Enter it below to create your account.
            </p>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="mt-7">
              {/* OTP boxes */}
              <div
                className="flex gap-3 justify-center"
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-border bg-transparent focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    style={{ caretColor: "transparent" }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="btn-hot w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-7"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </button>
            </form>

            {/* Spam folder hint */}
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-400 mt-0.5 flex-shrink-0"
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs text-amber-300 leading-relaxed">
                Can&apos;t find the email? Check your{" "}
                <span className="font-semibold">spam or junk folder</span> — it
                may have landed there.
              </p>
            </div>

            {/* Resend success message */}
            {resendSuccess && (
              <p className="mt-3 text-center text-xs text-green-400 font-medium">
                ✓ A new code was sent to {pendingEmail}
              </p>
            )}

            <p className="muted-text mt-4 text-center text-sm">
              Didn&apos;t receive the code?{" "}
              {resendCooldown > 0 ? (
                <span className="text-muted">
                  Resend in{" "}
                  <span className="font-semibold text-accent">
                    {resendCooldown}s
                  </span>
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="font-semibold text-accent hover:underline disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Resend OTP"}
                </button>
              )}
            </p>

            <p className="muted-text mt-2 text-center text-xs">
              The code expires in 10 minutes.
            </p>
          </>
        )}
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

        {step === 2 && (
          <div className="mt-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
            <div className="flex items-start gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent mt-0.5 flex-shrink-0"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div>
                <p className="text-sm font-semibold">Email verified for security</p>
                <p className="muted-text mt-1 text-xs leading-relaxed">
                  We verify your email before creating your account to keep
                  AceAI safe and spam-free.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
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
