import React from "react";
import Link from "next/link";

export default function Dashboard() {
  const interviews = [
    ["Frontend Engineer", "JavaScript fundamentals", "82", "Ready for review"],
    ["Product Manager", "Behavioral leadership", "76", "Needs examples"],
    ["Data Analyst", "SQL case study", "88", "Strong answer depth"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0f766e]">
            Candidate workspace
          </p>
          <h1 className="mt-2 text-4xl font-bold text-[#111827]">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-[#64748b]">
            Review interview performance, resume strength, and the next practice
            sessions to prioritize.
          </p>
        </div>
        <Link
          href="/signup"
          className="rounded-md bg-[#ea580c] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c2410c]"
        >
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
          <article key={label} className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#64748b]">{label}</p>
            <p className="mt-2 text-3xl font-bold text-[#17202a]">{value}</p>
            <p className="mt-2 text-sm text-[#0f766e]">{note}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#17202a]">Recent interviews</h2>
              <p className="mt-1 text-sm text-[#64748b]">Latest practice attempts and review states.</p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-[#64748b]">
                  <th className="px-4 py-2 font-semibold">Role</th>
                  <th className="px-4 py-2 font-semibold">Focus</th>
                  <th className="px-4 py-2 font-semibold">Score</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map(([role, focus, score, status]) => (
                  <tr key={`${role}-${focus}`} className="bg-[#f8fafc]">
                    <td className="rounded-l-md px-4 py-4 font-semibold text-[#17202a]">{role}</td>
                    <td className="px-4 py-4 text-[#475569]">{focus}</td>
                    <td className="px-4 py-4 font-bold text-[#0f766e]">{score}%</td>
                    <td className="rounded-r-md px-4 py-4 text-[#475569]">{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#17202a]">Resume signals</h2>
          <div className="mt-5 space-y-5">
            {[
              ["Impact metrics", 68, "#ea580c"],
              ["Keyword match", 81, "#0f766e"],
              ["Project clarity", 72, "#0891b2"],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-[#334155]">{label}</span>
                  <span className="text-[#64748b]">{value}%</span>
                </div>
                <div className="mt-2 h-2 rounded bg-[#e2e8f0]">
                  <div
                    className="h-2 rounded"
                    style={{ width: `${value}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-lg bg-[#fff7ed] p-4 text-sm leading-6 text-[#9a3412]">
            Add quantified outcomes to two projects before your next behavioral
            round.
          </p>
        </aside>
      </section>
    </div>
  );
}
