import React from "react";
import Link from "next/link";
import {connectDB} from "../imports";
export default async function Home() {
  const metrics = [
    ["Clarity", "88", "Answer flow"],
    ["Depth", "76", "Technical detail"],
    ["Confidence", "81", "Delivery"],
  ];
  // await connectDB();
  

  return (
    <div className="page-shell overflow-hidden">
      <section>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <p className="accent-pill mb-5 inline-flex rounded-md px-3 py-1 text-sm font-semibold">
              AI interview engine + resume intelligence
            </p>
            <h1 className="title-text max-w-3xl text-4xl font-black leading-[1.02] sm:text-6xl lg:text-7xl">
              Train for the interview before it trains on you.
            </h1>
            <p className="soft-text mt-6 max-w-2xl text-lg leading-8">
              Run adaptive AI interviews, analyze your resume, and turn every
              answer into measurable signals for clarity, depth, and confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary">
                Start practice -&gt;
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                View dashboard
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["12+", "Practice modes"],
                ["82%", "Avg readiness"],
                ["24/7", "Mock rounds"],
              ].map(([value, label]) => (
                <div key={label} className="tech-card-subtle rounded-lg p-4">
                  <p className="title-text text-2xl font-black">{value}</p>
                  <p className="muted-text mt-1 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="tech-card relative overflow-hidden rounded-xl p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
            <div className="tech-card-subtle relative rounded-lg p-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm font-bold text-accent">LIVE INTERVIEW</p>
                  <p className="title-text mt-1 text-2xl font-black">Frontend Engineer</p>
                </div>
                <span className="hot-pill rounded-md px-3 py-1 text-sm font-bold">
                  82 readiness
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-lg bg-background/40 p-4 font-mono text-sm">
                  <p className="console-line rounded px-3 py-2">
                    &gt; Prompt: Explain how you would optimize a slow React page.
                  </p>
                  <p className="muted-text mt-3 px-3">
                    analyzing response structure... detecting examples... scoring
                    confidence markers...
                  </p>
                </div>

                <div className="flex h-28 items-end gap-2 rounded-lg bg-background/40 p-4">
                  {[42, 84, 56, 98, 72, 110, 64, 92, 118, 78, 106, 88].map(
                    (height, index) => (
                      <span
                        key={`${height}-${index}`}
                        className="signal-bar w-full rounded-t"
                        style={{ height: `${height}px` }}
                      />
                    ),
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {metrics.map(([item, score, note]) => (
                    <div key={item} className="tech-card-subtle rounded-lg p-4">
                      <p className="muted-text text-sm">{item}</p>
                      <p className="title-text mt-2 text-3xl font-black">{score}</p>
                      <p className="mt-1 text-xs font-semibold text-accent">{note}</p>
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
            <div key={title} className="tech-card rounded-lg p-6">
              <p className="title-text text-lg font-bold">{title}</p>
              <p className="muted-text mt-3 leading-7">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
