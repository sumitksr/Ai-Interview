"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

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
        return;
      }

      login();
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    }
  }

  return (
    <div className="page-shell mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:py-16">
      <section className="tech-card hidden rounded-lg p-8 lg:block">
        <p className="text-sm font-semibold text-accent">Welcome back</p>
        <h1 className="title-text mt-3 text-4xl font-black leading-tight">
          Continue where your last practice round left off.
        </h1>
        <div className="mt-8 space-y-4">
          {[
            ["Last score", "82%", "Frontend Engineer session"],
            ["Next drill", "STAR storytelling", "Behavioral answer structure"],
            ["Resume task", "Add metrics", "Strengthen project outcomes"],
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
        <h2 className="title-text mt-3 text-3xl font-black">Access your dashboard</h2>
        <p className="muted-text mt-3">
          Enter your credentials to review interview sessions and resume feedback.
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

          <button type="submit" className="btn-primary w-full">
            Log in -&gt;
          </button>
        </form>

        <p className="muted-text mt-6 text-center text-sm">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </div>
  );
}
