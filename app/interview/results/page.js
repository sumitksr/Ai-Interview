"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Score ring component
function ScoreRing({ score, size = 120 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return "#22c55e";
    if (s >= 60) return "#06b6d4";
    if (s >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const color = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-[var(--muted)]">/ 100</span>
      </div>
    </div>
  );
}

function getScoreLabel(score) {
  if (score >= 85) return { label: "Excellent", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (score >= 70) return { label: "Good", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" };
  if (score >= 55) return { label: "Average", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  return { label: "Needs Work", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" };
}

function getHiringColor(rec) {
  if (rec?.toLowerCase().includes("strong yes")) return "text-green-400 bg-green-500/10 border-green-500/30";
  if (rec?.toLowerCase().includes("yes")) return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
  if (rec?.toLowerCase().includes("maybe")) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  return "text-red-400 bg-red-500/10 border-red-500/30";
}

export default function InterviewResults() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("interviewAnalysis");
    if (data) {
      setAnalysis(JSON.parse(data));
    } else {
      router.push("/interview/setup");
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="page-shell flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-[var(--cyan)]"></div>
      </div>
    );
  }

  if (!analysis) return null;

  const scoreInfo = getScoreLabel(analysis.overallScore);
  const hiringColorClass = getHiringColor(analysis.hiringRecommendation);

  return (
    <div className="page-shell mx-auto max-w-4xl px-5 py-12 sm:px-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 text-[var(--cyan)] text-sm font-semibold mb-5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Interview Complete · Saved to Profile
        </div>
        <h1 className="title-text text-4xl font-black tracking-tight mb-3">Your Interview Analysis</h1>
        <p className="muted-text text-lg max-w-xl mx-auto">
          Powered by GPT-4o Mini — here's a detailed breakdown of your performance.
        </p>
      </div>

      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden">
        {/* Decorative glow */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--cyan)" }}
        ></div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <ScoreRing score={analysis.overallScore} size={130} />
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-bold border ${scoreInfo.bg} ${scoreInfo.color}`}
            >
              {scoreInfo.label}
            </span>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">Overall Assessment</h2>
            <p className="text-[var(--muted)] leading-relaxed mb-5">{analysis.overallSummary}</p>

            <div className="flex flex-wrap gap-3">
              <div className={`px-4 py-2 rounded-xl border text-sm font-semibold ${hiringColorClass}`}>
                🎯 Hiring: {analysis.hiringRecommendation}
              </div>
              <div className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] text-sm">
                📋 {analysis.questionAnalysis?.length || 0} Questions Analyzed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Improvements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Strengths */}
        <div className="bg-[var(--surface)]/60 border border-[var(--border)] rounded-2xl p-6">
          <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              ✓
            </span>
            Strengths
          </h3>
          <ul className="space-y-3">
            {(analysis.strengths || []).map((strength, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-[var(--muted)] text-sm leading-relaxed">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-[var(--surface)]/60 border border-[var(--border)] rounded-2xl p-6">
          <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              ↗
            </span>
            Areas to Improve
          </h3>
          <ul className="space-y-3">
            {(analysis.areasForImprovement || []).map((area, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-[var(--muted)] text-sm leading-relaxed">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-Question Analysis */}
      <div className="mb-8">
        <h2 className="title-text text-2xl font-bold mb-5">Question-by-Question Breakdown</h2>
        <div className="space-y-4">
          {(analysis.questionAnalysis || []).map((qa, idx) => {
            const qScore = qa.score || 0;
            const qInfo = getScoreLabel(qScore);
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={idx}
                className="bg-[var(--surface)]/60 border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Question header - clickable to expand */}
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full text-left p-6 flex items-start gap-4 hover:bg-[var(--surface-2)]/30 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <ScoreRing score={qScore} size={56} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                        Q{idx + 1}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${qInfo.bg} ${qInfo.color}`}>
                        {qInfo.label}
                      </span>
                    </div>
                    <p className="text-[var(--foreground)] font-semibold text-sm leading-snug line-clamp-2">
                      {qa.question}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[var(--muted)] flex-shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] p-6 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    {/* Your answer */}
                    <div className="p-4 bg-[var(--surface-2)] rounded-xl">
                      <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">Your Answer</p>
                      <p className="text-[var(--foreground)] text-sm leading-relaxed">
                        {qa.answer && qa.answer.trim() ? qa.answer : <em className="text-[var(--muted)]">No answer provided</em>}
                      </p>
                    </div>

                    {/* Feedback */}
                    <div className="p-4 bg-[var(--cyan)]/5 border border-[var(--cyan)]/15 rounded-xl">
                      <p className="text-xs font-bold text-[var(--cyan)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        AI Feedback
                      </p>
                      <p className="text-[var(--muted)] text-sm leading-relaxed">{qa.feedback}</p>
                    </div>

                    {/* Mistake */}
                    {qa.mistake && qa.mistake.toLowerCase() !== "none" && (
                      <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl">
                        <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Key Mistake / Gap
                        </p>
                        <p className="text-[var(--muted)] text-sm leading-relaxed">{qa.mistake}</p>
                      </div>
                    )}

                    {/* Better Approach */}
                    {qa.betterApproach && (
                      <div className="p-4 bg-green-500/5 border border-green-500/15 rounded-xl">
                        <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l14 9-14 9V3z" />
                          </svg>
                          Better Approach
                        </p>
                        <p className="text-[var(--muted)] text-sm leading-relaxed">{qa.betterApproach}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Steps */}
      {analysis.nextSteps && (
        <div className="bg-gradient-to-r from-[var(--cyan)]/10 to-[var(--accent)]/10 border border-[var(--cyan)]/20 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Recommended Next Steps
          </h3>
          <p className="text-[var(--muted)] text-sm leading-relaxed">{analysis.nextSteps}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => {
            localStorage.removeItem("interviewAnalysis");
            router.push("/interview/setup");
          }}
          className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)] hover:scale-[1.02] shadow-lg transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Practice Again
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-8 py-3 rounded-xl font-bold bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors border border-[var(--border)]"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
