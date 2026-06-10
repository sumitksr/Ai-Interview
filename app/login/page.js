import React from "react";
import Link from "next/link";

export default function Login() {
  async function handleSubmit(formData) {
    "use server";

    const email = formData.get("email");
    const password = formData.get("password");

    console.log(email, password);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:py-16">
      <section className="hidden rounded-lg border border-[#dbe4ef] bg-white p-8 shadow-sm lg:block">
        <p className="text-sm font-semibold text-[#0f766e]">Welcome back</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-[#111827]">
          Continue where your last practice round left off.
        </h1>
        <div className="mt-8 space-y-4">
          {[
            ["Last score", "82%", "Frontend Engineer session"],
            ["Next drill", "STAR storytelling", "Behavioral answer structure"],
            ["Resume task", "Add metrics", "Strengthen project outcomes"],
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-lg bg-[#f8fafc] p-5">
              <p className="text-sm font-semibold text-[#64748b]">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[#17202a]">{value}</p>
              <p className="mt-1 text-sm text-[#64748b]">{note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#dbe4ef] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0f766e]">
          Log in
        </p>
        <h2 className="mt-3 text-3xl font-bold text-[#111827]">Access your dashboard</h2>
        <p className="mt-3 text-[#64748b]">
          Enter your credentials to review interview sessions and resume feedback.
        </p>

        <form action={handleSubmit} className="mt-8 space-y-5">
          <label className="block" htmlFor="email">
            <span className="text-sm font-semibold text-[#334155]">Email</span>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-md border border-[#cbd5e1] px-4 py-3 text-[#17202a] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#ccfbf1]"
            />
          </label>

          <label className="block" htmlFor="password">
            <span className="text-sm font-semibold text-[#334155]">Password</span>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="Your password"
              className="mt-2 w-full rounded-md border border-[#cbd5e1] px-4 py-3 text-[#17202a] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#ccfbf1]"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115e59]"
          >
            Log in -&gt;
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#64748b]">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-[#0f766e] hover:text-[#115e59]">
            Create an account
          </Link>
        </p>
      </section>
    </div>
  );
}
