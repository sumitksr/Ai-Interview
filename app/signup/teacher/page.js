"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TeacherSignup() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Step 1 = signup form, Step 2 = OTP verification
  const [step, setStep] = useState(1);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingFormData, setPendingFormData] = useState(null);
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
    const username = formData.get("username");
    const fees = formData.get("fees");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/v1/user/signup/teacher/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, username, fees, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP.");
        setLoading(false);
        return;
      }

      setPendingEmail(email);
      setPendingFormData({ name, email, username, fees, password });
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(15);
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
      const res = await fetch("/api/v1/user/signup/teacher", {
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
    setLoading(true);
    setResendSuccess(false);
    setError("");
    try {
      const res = await fetch("/api/v1/user/signup/teacher/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingFormData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend OTP.");
      } else {
        setResendCooldown(15);
        setResendSuccess(true);
        setOtp(["", "", "", "", "", ""]);
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
                    Sending verification code…
                  </>
                ) : (
                  "Apply as Teacher →"
                )}
              </button>
            </form>

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
              className="flex items-center gap-1.5 text-sm muted-text hover:text-cyan transition-colors mb-6"
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

            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 mb-5">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-cyan"
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
              <span className="font-semibold text-cyan">{pendingEmail}</span>.
              Enter it below to complete your mentor registration.
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
                    className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-border bg-transparent focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20 transition-all"
                    style={{ caretColor: "transparent" }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-7"
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

            {/* Resend success message */}
            {resendSuccess && (
              <p className="mt-4 text-center text-sm text-emerald-400">A new OTP has been sent to your email.</p>
            )}

            <p className="muted-text mt-5 text-center text-sm">
              Didn&apos;t receive the code?{" "}
              {resendCooldown > 0 ? (
                <span className="text-muted">
                  Resend in{" "}
                  <span className="font-semibold text-cyan">
                    {resendCooldown}s
                  </span>
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="font-semibold text-cyan hover:underline disabled:opacity-50"
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

        {step === 2 && (
          <div className="mt-4 p-4 rounded-lg bg-cyan/5 border border-cyan/20">
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
                className="text-cyan mt-0.5 flex-shrink-0"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div>
                <p className="text-sm font-semibold">
                  Email verified for security
                </p>
                <p className="muted-text mt-1 text-xs leading-relaxed">
                  We verify your email before creating your mentor account to
                  keep AceAI safe and trusted.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
