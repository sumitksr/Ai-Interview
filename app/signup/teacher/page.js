"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/imports";

export default function TeacherSignup() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

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

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Signup failed");
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
    <div className="page-shell mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-16">
      <section className="tech-card rounded-lg p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan">
          Teacher Sign up
        </p>
        <h1 className="title-text mt-3 text-3xl font-black">Become an Interviewer</h1>
        <p className="muted-text mt-3">
          Join our platform to conduct live mock interviews and help candidates succeed.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="soft-text text-sm font-semibold">Full name</span>
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
            <span className="soft-text text-sm font-semibold">Username</span>
            <input
              name="username"
              type="text"
              required
              placeholder="e.g. tech_guru_99"
              className="input-control mt-2"
            />
          </label>

          <label className="block">
            <span className="soft-text text-sm font-semibold">Hourly Fee ($)</span>
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
            <span className="soft-text text-sm font-semibold">Password</span>
            <input
              name="password"
              type="password"
              required
              placeholder="Create a password"
              className="input-control mt-2"
            />
          </label>

          <button type="submit" className="btn-primary w-full">
            Apply as Teacher -&gt;
          </button>
        </form>

        <p className="muted-text mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Log in
          </Link>
        </p>
        <p className="muted-text mt-2 text-center text-sm">
          Looking to practice interviews?{" "}
          <Link href="/signup" className="font-semibold text-cyan hover:underline">
            Sign up as a Student
          </Link>
        </p>
      </section>

      <section className="tech-card rounded-lg p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan">Why teach with us?</p>
        <div className="mt-6 space-y-4">
          {[
            ["Set your own schedule", "Conduct interviews whenever you are available, right from your dashboard."],
            ["Earn competitive rates", "You set your own hourly fee and keep the majority of your earnings."],
            ["Help candidates succeed", "Provide valuable feedback and guide the next generation of professionals."],
          ].map(([title, text]) => (
            <div key={title} className="tech-card-subtle rounded-lg p-5">
              <p className="font-bold">{title}</p>
              <p className="muted-text mt-2 text-sm leading-6">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
