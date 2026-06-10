import React from "react";

export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0f766e]">
            About the platform
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-[#111827] sm:text-5xl">
            Interview preparation that feels specific to your next role.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#475569]">
            AI Interview Coach combines structured practice, resume review, and
            feedback loops so candidates can rehearse with purpose instead of
            guessing what to improve.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Role aware", "Questions and coaching adapt to the position you are targeting."],
            ["Actionable", "Feedback is broken into clarity, structure, depth, and confidence."],
            ["Trackable", "Every session contributes to a simple picture of your progress."],
            ["Practical", "Resume insights connect your experience to interview talking points."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#17202a]">{title}</h2>
              <p className="mt-3 leading-7 text-[#64748b]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-lg border border-[#dbe4ef] bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-3xl font-bold text-[#ea580c]">3</p>
            <p className="mt-2 font-semibold text-[#17202a]">Core workflows</p>
            <p className="mt-2 text-[#64748b]">Practice, review, and improve with one flow.</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0f766e]">24/7</p>
            <p className="mt-2 font-semibold text-[#17202a]">Available prep</p>
            <p className="mt-2 text-[#64748b]">Run another round whenever you are ready.</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0891b2]">1</p>
            <p className="mt-2 font-semibold text-[#17202a]">Clear next step</p>
            <p className="mt-2 text-[#64748b]">Each session ends with a focused improvement target.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
