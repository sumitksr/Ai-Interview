import React from "react";

export default function About() {
  return (
    <div className="page-shell mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            About the platform
          </p>
          <h1 className="title-text mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Interview preparation that feels specific to your next role.
          </h1>
          <p className="soft-text mt-5 text-lg leading-8">
            AI Interview Platform combines structured practice, resume review,
            and feedback loops so candidates can rehearse with purpose instead
            of guessing what to improve.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Role aware", "Questions adapt to the position you are targeting."],
            ["Actionable", "Feedback is broken into clarity, structure, depth, and confidence."],
            ["Trackable", "Every session contributes to a simple picture of your progress."],
            ["Practical", "Resume insights connect your experience to interview talking points."],
          ].map(([title, text]) => (
            <article key={title} className="tech-card rounded-lg p-6">
              <h2 className="title-text text-lg font-bold">{title}</h2>
              <p className="muted-text mt-3 leading-7">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tech-card mt-14 rounded-lg p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-3xl font-black text-hot">3</p>
            <p className="title-text mt-2 font-semibold">Core workflows</p>
            <p className="muted-text mt-2">Practice, review, and improve with one flow.</p>
          </div>
          <div>
            <p className="text-3xl font-black text-accent">24/7</p>
            <p className="title-text mt-2 font-semibold">Available prep</p>
            <p className="muted-text mt-2">Run another round whenever you are ready.</p>
          </div>
          <div>
            <p className="text-3xl font-black text-cyan">1</p>
            <p className="title-text mt-2 font-semibold">Clear next step</p>
            <p className="muted-text mt-2">Each session ends with a focused improvement target.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
