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
    <div className="page-shell mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-16">
      <section className="tech-card rounded-lg p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-hot">
          Sign up
        </p>
        <h1 className="title-text mt-3 text-3xl font-black">Create your prep workspace</h1>
        <p className="muted-text mt-3">
          Set your target role and start with a personalized practice plan.
        </p>

        <form action={handleSubmit} className="mt-8 space-y-5">
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
            <span className="soft-text text-sm font-semibold">Target role</span>
            <select
              name="targetRole"
              required
              defaultValue=""
              className="input-control mt-2"
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
            <span className="soft-text text-sm font-semibold">Password</span>
            <input
              name="password"
              type="password"
              required
              placeholder="Create a password"
              className="input-control mt-2"
            />
          </label>

          <button type="submit" className="btn-hot w-full">
            Create account -&gt;
          </button>
        </form>

        <p className="muted-text mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Log in
          </Link>
        </p>
      </section>

      <section className="tech-card rounded-lg p-6 sm:p-8">
        <p className="text-sm font-semibold text-hot">Your first plan includes</p>
        <div className="mt-6 space-y-4">
          {[
            ["Resume review", "Find missing skills and strengthen project impact."],
            ["Interview roadmap", "Practice the question types most likely for your role."],
            ["Score tracking", "Measure clarity, depth, confidence, and structure."],
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
