import React from "react";
import Link from "next/link";

export default function Signup() {
  async function handleSubmit(formData) {
    "use server";

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      targetRole: formData.get("targetRole"),
      password: formData.get("password"),
    };

    console.log(payload);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-16">
      <section className="rounded-lg border border-[#dbe4ef] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#ea580c]">
          Sign up
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#111827]">Create your prep workspace</h1>
        <p className="mt-3 text-[#64748b]">
          Set your target role and start with a personalized practice plan.
        </p>

        <form action={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-[#334155]">Full name</span>
            <input
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="mt-2 w-full rounded-md border border-[#cbd5e1] px-4 py-3 text-[#17202a] outline-none transition focus:border-[#ea580c] focus:ring-4 focus:ring-[#fed7aa]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#334155]">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-md border border-[#cbd5e1] px-4 py-3 text-[#17202a] outline-none transition focus:border-[#ea580c] focus:ring-4 focus:ring-[#fed7aa]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#334155]">Target role</span>
            <select
              name="targetRole"
              required
              defaultValue=""
              className="mt-2 w-full rounded-md border border-[#cbd5e1] bg-white px-4 py-3 text-[#17202a] outline-none transition focus:border-[#ea580c] focus:ring-4 focus:ring-[#fed7aa]"
            >
              <option value="" disabled>
                Select a role
              </option>
              <option>Software Engineer</option>
              <option>Data Analyst</option>
              <option>Product Manager</option>
              <option>UX Designer</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#334155]">Password</span>
            <input
              name="password"
              type="password"
              required
              placeholder="Create a password"
              className="mt-2 w-full rounded-md border border-[#cbd5e1] px-4 py-3 text-[#17202a] outline-none transition focus:border-[#ea580c] focus:ring-4 focus:ring-[#fed7aa]"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-[#ea580c] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c2410c]"
          >
            Create account -&gt;
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#64748b]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#0f766e] hover:text-[#115e59]">
            Log in
          </Link>
        </p>
      </section>

      <section className="rounded-lg bg-[#17202a] p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-[#fed7aa]">Your first plan includes</p>
        <div className="mt-6 space-y-4">
          {[
            ["Resume review", "Find missing skills and strengthen project impact."],
            ["Interview roadmap", "Practice the question types most likely for your role."],
            ["Score tracking", "Measure clarity, depth, confidence, and structure."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-5">
              <p className="font-bold">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[#cbd5e1]">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
