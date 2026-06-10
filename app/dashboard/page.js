import React from "react";
import Link from "next/link";

export default function Dashboard() {
  const interviews = [
    ["Frontend Engineer", "JavaScript fundamentals", "82", "Ready for review"],
    ["Product Manager", "Behavioral leadership", "76", "Needs examples"],
    ["Data Analyst", "SQL case study", "88", "Strong answer depth"],
  ];

  return (
    <div className="page-shell mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            Candidate workspace
          </p>
          <h1 className="title-text mt-2 text-4xl font-black">Dashboard</h1>
          <p className="muted-text mt-3 max-w-2xl">
            Review interview performance, resume strength, and the next practice
            sessions to prioritize.
          </p>
        </div>
        <Link href="/signup" className="btn-hot">
          New session -&gt;
        </Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Sessions", "12", "+3 this week"],
          ["Avg score", "82%", "+6 points"],
          ["Resume fit", "74%", "Add project metrics"],
          ["Next goal", "System design", "2 drills queued"],
        ].map(([label, value, note]) => (
          <article key={label} className="tech-card rounded-lg p-5">
            <p className="muted-text text-sm font-semibold">{label}</p>
            <p className="title-text mt-2 text-3xl font-black">{value}</p>
            <p className="mt-2 text-sm text-accent">{note}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="tech-card rounded-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="title-text text-xl font-bold">Recent interviews</h2>
              <p className="muted-text mt-1 text-sm">Latest practice attempts and review states.</p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="muted-text">
                  <th className="px-4 py-2 font-semibold">Role</th>
                  <th className="px-4 py-2 font-semibold">Focus</th>
                  <th className="px-4 py-2 font-semibold">Score</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map(([role, focus, score, status]) => (
                  <tr key={`${role}-${focus}`} className="tech-card-subtle">
                    <td className="title-text rounded-l-md px-4 py-4 font-semibold">{role}</td>
                    <td className="soft-text px-4 py-4">{focus}</td>
                    <td className="px-4 py-4 font-bold text-accent">{score}%</td>
                    <td className="soft-text rounded-r-md px-4 py-4">{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="tech-card rounded-lg p-6">
          <h2 className="title-text text-xl font-bold">Resume signals</h2>
          <div className="mt-5 space-y-5">
            {[
              ["Impact metrics", 68, "var(--hot)"],
              ["Keyword match", 81, "var(--accent)"],
              ["Project clarity", 72, "var(--cyan)"],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="flex justify-between text-sm">
                  <span className="soft-text font-semibold">{label}</span>
                  <span className="muted-text">{value}%</span>
                </div>
                <div className="mt-2 h-2 rounded bg-panel">
                  <div
                    className="h-2 rounded"
                    style={{ width: `${value}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="soft-text mt-6 rounded-lg bg-hot/10 p-4 text-sm leading-6">
            Add quantified outcomes to two projects before your next behavioral
            round.
          </p>
        </aside>
      </section>
    </div>
  );
}
