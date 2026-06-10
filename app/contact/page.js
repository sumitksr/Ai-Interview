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
    <div className="page-shell mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-16">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Contact
        </p>
        <h1 className="title-text mt-3 text-4xl font-black sm:text-5xl">
          Tell us what you are preparing for.
        </h1>
        <p className="soft-text mt-5 text-lg leading-8">
          Share your target role, timeline, or feedback. The team can help shape
          the experience around your interview preparation workflow.
        </p>
        <div className="mt-8 space-y-4">
          {[
            ["Support", "help@aiinterviewplatform.dev"],
            ["Response time", "Usually within one business day"],
            ["Best for", "Product, engineering, data, and operations roles"],
          ].map(([label, value]) => (
            <div key={label} className="tech-card rounded-lg p-5">
              <p className="muted-text text-sm font-semibold">{label}</p>
              <p className="title-text mt-1 font-bold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <form action={handleSubmit} className="tech-card rounded-lg p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="soft-text text-sm font-semibold">Name</span>
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
        </div>
        <label className="mt-5 block">
          <span className="soft-text text-sm font-semibold">Message</span>
          <textarea
            name="message"
            required
            rows={7}
            placeholder="I am preparing for..."
            className="input-control mt-2 resize-none"
          />
        </label>
        <button type="submit" className="btn-primary mt-6">
          Send message -&gt;
        </button>
      </form>
    </div>
  );
}
