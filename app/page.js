import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <p className="mb-4 inline-flex rounded-md bg-[#ccfbf1] px-3 py-1 text-sm font-semibold text-[#0f766e]">
              Resume analysis plus AI interview practice
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-[#111827] sm:text-5xl lg:text-6xl">
              Practice interviews with focused feedback after every answer.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#475569]">
              Prepare for technical, behavioral, and role-specific interviews with
              guided sessions, resume insights, scoring, and clear next steps.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-md bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115e59]"
              >
                Start practice -&gt;
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-[#cbd5e1] bg-white px-5 py-3 text-sm font-semibold text-[#334155] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
              >
                View dashboard
              </Link>
            </div>
          </div>

          <div className="relative min-h-[430px] rounded-lg border border-[#dbe4ef] bg-[#f8fafc] p-5 shadow-sm">
            <div className="absolute inset-x-8 top-6 h-24 rounded-lg bg-[#fed7aa]" />
            <div className="relative rounded-lg border border-[#dbe4ef] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
                <div>
                  <p className="text-sm font-semibold text-[#0f766e]">Live session</p>
                  <p className="text-xl font-bold text-[#17202a]">Frontend Engineer</p>
                </div>
                <span className="rounded-md bg-[#ecfeff] px-3 py-1 text-sm font-semibold text-[#0891b2]">
                  82%
                </span>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-lg bg-[#f1f5f9] p-4">
                  <p className="text-sm font-semibold text-[#17202a]">
                    Explain how you would optimize a slow React page.
                  </p>
                  <div className="mt-4 flex items-end gap-2">
                    {[42, 64, 52, 78, 58, 86, 70, 92].map((height) => (
                      <span
                        key={height}
                        className="w-full rounded-t bg-[#0f766e]"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Clarity", "Depth", "Confidence"].map((item, index) => (
                    <div key={item} className="rounded-lg border border-[#e2e8f0] p-4">
                      <p className="text-sm text-[#64748b]">{item}</p>
                      <p className="mt-2 text-2xl font-bold text-[#17202a]">
                        {[88, 76, 81][index]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Interview simulator", "Run realistic sessions with role-based prompts and pacing."],
            ["Resume analyzer", "Spot missing keywords, unclear impact, and weak project framing."],
            ["Progress dashboard", "Track scores, attempts, strengths, and priority improvements."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <p className="text-lg font-bold text-[#17202a]">{title}</p>
              <p className="mt-3 leading-7 text-[#64748b]">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
