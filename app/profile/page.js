"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// ---------- Avatar helper (same as Navbar) ----------
const AVATAR_COLORS = [
  ["#d32f2f", "#ef9a9a"],
  ["#1565c0", "#90caf9"],
  ["#2e7d32", "#a5d6a7"],
  ["#e65100", "#ffcc80"],
  ["#6a1b9a", "#ce93d8"],
  ["#00695c", "#80cbc4"],
  ["#ad1457", "#f48fb1"],
  ["#0277bd", "#81d4fa"],
  ["#558b2f", "#c5e1a5"],
  ["#4527a0", "#b39ddb"],
];
function getAvatarStyle(name) {
  if (!name) return { background: "#1565c0", color: "#90caf9" };
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [bg, text] = AVATAR_COLORS[index];
  return { background: bg, color: text };
}

// ---------- Small sub-components ----------
function SectionCard({ title, icon, children }) {
  return (
    <div className="tech-card rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
          {icon}
        </div>
        <h2 className="font-bold text-lg text-[var(--foreground)]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Alert({ type, message, onClose }) {
  if (!message) return null;
  const styles = {
    success: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
    error: "bg-red-500/10 border-red-500/40 text-red-400",
    info: "bg-[var(--cyan-soft)] border-[var(--cyan)]/30 text-[var(--cyan)]",
  };
  return (
    <div className={`mt-4 px-4 py-3 rounded-xl border text-sm flex items-start justify-between gap-3 ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">✕</button>
      )}
    </div>
  );
}

function OtpInput({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.padEnd(6, "").split("");

  function handleChange(i, e) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = val;
    const joined = next.join("").replace(/ /g, "");
    onChange(joined.slice(0, 6));
    if (val && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] === " " ? "" : digits[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-14 text-center text-xl font-bold rounded-xl input-control"
          style={{ padding: 0 }}
        />
      ))}
    </div>
  );
}

// ---------- Main Profile Page ----------
export default function ProfilePage() {
  const { isLoggedIn, userInfo, setUserInfo } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editAlert, setEditAlert] = useState(null);

  // Set password state
  const [pwStep, setPwStep] = useState("idle"); // idle | sending | otp | setting | done
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwAlert, setPwAlert] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) router.push("/login");
  }, [isLoggedIn, router]);

  // Fetch profile data
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/v1/user/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setEditName(data.name || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoggedIn]);

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setEditLoading(true);
    setEditAlert(null);
    try {
      const res = await fetch("/api/v1/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      const data = await res.json();
      if (!res.ok) { setEditAlert({ type: "error", message: data.error }); return; }
      setProfile((p) => ({ ...p, name: data.name }));
      setUserInfo((u) => ({ ...u, name: data.name }));
      setEditAlert({ type: "success", message: "Profile updated successfully!" });
    } catch {
      setEditAlert({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setEditLoading(false);
    }
  }

  async function handleSendOtp() {
    setPwStep("sending");
    setPwAlert(null);
    try {
      const res = await fetch("/api/v1/user/send-otp", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setPwAlert({ type: "error", message: data.error }); setPwStep("idle"); return; }
      setPwStep("otp");
      setCooldown(60);
      setPwAlert({ type: "info", message: `OTP sent to ${profile.email}. Valid for 10 minutes.` });
    } catch {
      setPwAlert({ type: "error", message: "Failed to send OTP. Try again." });
      setPwStep("idle");
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwAlert({ type: "error", message: "Passwords don't match." });
      return;
    }
    if (newPassword.length < 8) {
      setPwAlert({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }
    if (otp.length < 6) {
      setPwAlert({ type: "error", message: "Please enter the full 6-digit OTP." });
      return;
    }
    setPwStep("setting");
    setPwAlert(null);
    try {
      const res = await fetch("/api/v1/user/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwAlert({ type: "error", message: data.error }); setPwStep("otp"); return; }
      setPwStep("done");
      setProfile((p) => ({ ...p, hasPassword: true }));
      setPwAlert({ type: "success", message: "Password set! You can now log in with email & password." });
    } catch {
      setPwAlert({ type: "error", message: "Something went wrong. Please try again." });
      setPwStep("otp");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="muted-text text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const avatarStyle = getAvatarStyle(profile.name);

  return (
    <div className="page-shell mx-auto max-w-3xl px-5 py-12 sm:px-8">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black overflow-hidden ring-4 ring-white/10 shadow-xl flex-shrink-0"
          style={profile.image ? {} : avatarStyle}
        >
          {profile.image ? (
            <img src={profile.image} alt={profile.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <span style={{ color: avatarStyle.color }}>{profile.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
          )}
        </div>

        {/* Name + meta */}
        <div className="text-center sm:text-left">
          <h1 className="title-text text-3xl font-black">{profile.name}</h1>
          <p className="muted-text mt-1">{profile.email}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="accent-pill text-xs font-bold px-3 py-1 rounded-full capitalize">{profile.role}</span>
            {profile.googleId && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google linked
              </span>
            )}
            {profile.githubId && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--soft-text)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.022A9.606 9.606 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                GitHub linked
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* ---- Edit Profile Section ---- */}
        <SectionCard
          title="Edit Profile"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          }
        >
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <label className="block">
              <span className="soft-text text-sm font-semibold">Full name</span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                minLength={2}
                required
                placeholder="Your full name"
                className="input-control mt-2"
              />
            </label>
            <label className="block">
              <span className="soft-text text-sm font-semibold">Email</span>
              <input
                type="email"
                value={profile.email}
                disabled
                className="input-control mt-2 opacity-50 cursor-not-allowed"
              />
              <p className="muted-text text-xs mt-1">Email cannot be changed.</p>
            </label>
            <Alert type={editAlert?.type} message={editAlert?.message} onClose={() => setEditAlert(null)} />
            <button
              type="submit"
              disabled={editLoading || editName.trim() === profile.name}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editLoading ? "Saving…" : "Save changes"}
            </button>
          </form>
        </SectionCard>

        {/* ---- Set Password Section ---- */}
        {!profile.hasPassword ? (
          <SectionCard
            title="Set a Password"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            }
          >
            <p className="muted-text text-sm mb-5 leading-relaxed">
              You signed up via <strong className="text-[var(--soft-text)]">{profile.googleId ? "Google" : "GitHub"}</strong> and don't have a password yet.
              Setting one lets you also log in with your email and password.
            </p>

            {pwStep === "idle" && (
              <>
                <Alert type={pwAlert?.type} message={pwAlert?.message} onClose={() => setPwAlert(null)} />
                <button onClick={handleSendOtp} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
                  Send OTP to {profile.email}
                </button>
              </>
            )}

            {pwStep === "sending" && (
              <div className="flex items-center gap-3 text-[var(--muted)] text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                Sending OTP to {profile.email}…
              </div>
            )}

            {(pwStep === "otp" || pwStep === "setting") && (
              <form onSubmit={handleSetPassword} className="space-y-6">
                <Alert type={pwAlert?.type} message={pwAlert?.message} onClose={() => setPwAlert(null)} />

                <div>
                  <p className="soft-text text-sm font-semibold mb-3">Enter the 6-digit OTP</p>
                  <OtpInput value={otp} onChange={setOtp} />
                  <div className="mt-3 text-center">
                    {cooldown > 0 ? (
                      <span className="muted-text text-xs">Resend OTP in {cooldown}s</span>
                    ) : (
                      <button type="button" onClick={handleSendOtp} className="text-[var(--accent)] text-xs font-semibold hover:underline">
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <label className="block">
                  <span className="soft-text text-sm font-semibold">New password</span>
                  <div className="relative mt-2">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={8}
                      required
                      placeholder="At least 8 characters"
                      className="input-control pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      {showPw ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="soft-text text-sm font-semibold">Confirm password</span>
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                    placeholder="Re-enter password"
                    className="input-control mt-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={pwStep === "setting" || otp.length < 6}
                  className="btn-primary w-full rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pwStep === "setting" ? "Setting password…" : "Set password →"}
                </button>
              </form>
            )}

            {pwStep === "done" && (
              <Alert type="success" message="🎉 Password set! You can now log in with email & password." />
            )}
          </SectionCard>
        ) : (
          <SectionCard
            title="Password"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)] text-sm">Password is set</p>
                <p className="muted-text text-xs">You can log in with email &amp; password.</p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* ---- Account Info ---- */}
        <SectionCard
          title="Account Info"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }
        >
          <dl className="space-y-4">
            {[
              ["Member since", new Date(profile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })],
              ["Account role", profile.role],
              ["Login methods", [profile.hasPassword && "Email & Password", profile.googleId && "Google", profile.githubId && "GitHub"].filter(Boolean).join(" · ")],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <dt className="muted-text text-sm font-semibold w-36 shrink-0">{label}</dt>
                <dd className="soft-text text-sm capitalize">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}
