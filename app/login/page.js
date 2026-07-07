"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/v1/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      const data = await res.json();
      login({ name: data.name, image: data.image, role: data.role });
      
      if (data.role === "teacher") {
        router.push("/mentor/dashboard");
      } else if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="page-shell mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:py-16">
      <section className="tech-card hidden rounded-lg p-8 lg:block">
        <p className="text-sm font-semibold text-accent">Welcome back to PrepAI</p>
        <h1 className="title-text mt-3 text-4xl font-black leading-tight">
          Ready to continue your interview journey?
        </h1>
        <div className="mt-8 space-y-4">
          {[
            ["Latest Assessment", "92%", "Senior React Developer"],
            ["Recommended Practice", "System Design", "Focus on scalability"],
            ["Resume Insight", "Highlight Impact", "Quantify your past achievements"],
          ].map(([label, value, note]) => (
            <div key={label} className="tech-card-subtle rounded-lg p-5">
              <p className="muted-text text-sm font-semibold">{label}</p>
              <p className="title-text mt-1 text-2xl font-bold">{value}</p>
              <p className="muted-text mt-1 text-sm">{note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="tech-card rounded-lg p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Log in
        </p>
        <h2 className="title-text mt-3 text-3xl font-black">Access PrepAI Workspace</h2>
        <p className="muted-text mt-3">
          Sign in to view your progress, review past interviews, and start new mock sessions.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block" htmlFor="email">
            <span className="soft-text text-sm font-semibold">Email</span>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="you@example.com"
              className="input-control mt-2"
            />
          </label>

          <label className="block" htmlFor="password">
            <span className="soft-text text-sm font-semibold">Password</span>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="Your password"
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
                Logging in…
              </>
            ) : (
              "Log in to PrepAI →"
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px bg-[var(--border)] flex-1"></div>
          <span className="text-sm font-semibold text-[var(--muted)]">or</span>
          <div className="h-px bg-[var(--border)] flex-1"></div>
        </div>

        <OAuthButtons />

        <p className="muted-text mt-6 text-center text-sm">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-accent hover:underline">
            Sign up for free
          </Link>
        </p>
      </section>
    </div>
  );
}

function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = React.useState(null);

  async function handleOAuth(provider) {
    setLoadingProvider(provider);
    const { signIn } = await import("next-auth/react");
    await signIn(provider, { callbackUrl: "/dashboard" });
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <button
        id="google-signin-btn"
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={!!loadingProvider}
        className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === "google" ? (
          <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </button>

      <button
        id="github-signin-btn"
        type="button"
        onClick={() => handleOAuth("github")}
        disabled={!!loadingProvider}
        className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === "github" ? (
          <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.022A9.606 9.606 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
        )}
        Continue with GitHub
      </button>
    </div>
  );
}
