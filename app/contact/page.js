import React from "react";

export default function Contact() {
  async function handleSubmit(formData) {
    "use server";

    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");

    console.log({ name, email, message });
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-16">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0f766e]">
          Contact
        </p>
        <h1 className="mt-3 text-4xl font-bold text-[#111827] sm:text-5xl">
          Tell us what you are preparing for.
        </h1>
        <p className="mt-5 text-lg leading-8 text-[#475569]">
          Share your target role, timeline, or feedback. The team can help shape
          the experience around your interview preparation workflow.
        </p>
        <div className="mt-8 space-y-4">
          {[
            ["Support", "help@aiinterviewcoach.dev"],
            ["Response time", "Usually within one business day"],
            ["Best for", "Product, engineering, data, and operations roles"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#64748b]">{label}</p>
              <p className="mt-1 font-bold text-[#17202a]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <form action={handleSubmit} className="rounded-lg border border-[#dbe4ef] bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[#334155]">Name</span>
            <input
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="mt-2 w-full rounded-md border border-[#cbd5e1] px-4 py-3 text-[#17202a] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#ccfbf1]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[#334155]">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-md border border-[#cbd5e1] px-4 py-3 text-[#17202a] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#ccfbf1]"
            />
          </label>
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-semibold text-[#334155]">Message</span>
          <textarea
            name="message"
            required
            rows={7}
            placeholder="I am preparing for..."
            className="mt-2 w-full resize-none rounded-md border border-[#cbd5e1] px-4 py-3 text-[#17202a] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#ccfbf1]"
          />
        </label>
        <button
          type="submit"
          className="mt-6 rounded-md bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115e59]"
        >
          Send message -&gt;
        </button>
      </form>
    </div>
  );
}
