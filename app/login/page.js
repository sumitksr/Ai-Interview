import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export default function Login() {
  async function handleSubmit(formData) {
    "use server";

    const email = formData.get("email");
    const password = formData.get("password");

    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      console.error("User not found.");
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("Invalid credentials.");
      return;
    }

    const cookieStore = await cookies();
    cookieStore.set("isLoggedIn", "true", { path: "/" });

    redirect("/dashboard");
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

        <form action={handleSubmit} className="mt-8 space-y-5">
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
