import React from "react";

export default function About() {
  return (
    <div className="page-shell mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            About PrepAI
          </p>
          <h1 className="title-text mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Empowering professionals to ace every interview.
          </h1>
          <p className="soft-text mt-5 text-lg leading-8">
            PrepAI is built on the belief that interview success comes from targeted practice and honest feedback. By combining advanced AI with industry-standard evaluation metrics, we help candidates stop guessing and start improving.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Tailored to You", "Questions dynamically adjust based on your desired role and experience level."],
            ["Actionable Insights", "Get a detailed breakdown of your clarity, structure, and technical depth."],
            ["Track Your Growth", "Visualize your progress over time and see your confidence soar."],
            ["Resume Synergy", "We connect your past experience directly to the answers you give."],
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
            <p className="text-3xl font-black text-hot">1</p>
            <p className="title-text mt-2 font-semibold">Unified Platform</p>
            <p className="muted-text mt-2">Everything from resume review to mock interviews in one place.</p>
          </div>
          <div>
            <p className="text-3xl font-black text-accent">24/7</p>
            <p className="title-text mt-2 font-semibold">Always Ready</p>
            <p className="muted-text mt-2">Practice whenever you feel inspired, without scheduling conflicts.</p>
          </div>
          <div>
            <p className="text-3xl font-black text-cyan">100%</p>
            <p className="title-text mt-2 font-semibold">Focus on Growth</p>
            <p className="muted-text mt-2">Every piece of feedback is designed to make you better.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
