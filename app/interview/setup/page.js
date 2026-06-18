"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InterviewSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasPrevResume, setHasPrevResume] = useState(false);
  const [usePrevResume, setUsePrevResume] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    targetRole: "",
    experienceLevel: "Mid",
    focus: "General",
    questionCount: "5",
    resumeText: "",
  });
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    async function checkPrevData() {
      try {
        const res = await fetch("/api/v1/dashboard");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) {
          const { userData } = await res.json();
          // Check if there is at least one interview with a resume
          if (userData?.interviewHistory?.length > 0) {
            const lastInterview = userData.interviewHistory[userData.interviewHistory.length - 1];
            if (lastInterview.resume && lastInterview.resume.length > 0) {
              setHasPrevResume(true);
              setUsePrevResume(true);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    checkPrevData();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setFormData(prev => ({...prev, resumeText: ""}));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.targetRole) {
      setError("Please specify a target role.");
      return;
    }

    if (!usePrevResume && !formData.resumeText.trim() && !resumeFile) {
      setError("Please upload a resume file, paste your resume text, or select to use your previous resume.");
      return;
    }

    setLoading(true);

    try {
      if (usePrevResume) {
        // Call the new endpoint — it fetches the stored resume text from DB and generates questions
        const res = await fetch("/api/v1/interview/use-previous", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetRole: formData.targetRole,
            experienceLevel: formData.experienceLevel,
            focus: formData.focus,
            questionCount: formData.questionCount,
          }),
        });

        if (!res.ok) {
          const result = await res.json();
          throw new Error(
            result.error ||
              "Could not load previous resume. Please upload a new one."
          );
        }

        const result = await res.json();

        localStorage.setItem(
          "interviewContext",
          JSON.stringify({
            targetRole: formData.targetRole,
            experienceLevel: formData.experienceLevel,
            focus: formData.focus,
            resumeUrl: result.resumeUrl || "",
            questions: result.questions,
          })
        );

        router.push("/interview/session");
        return;
      }

      const data = new FormData();
      data.append("targetRole", formData.targetRole);
      data.append("experienceLevel", formData.experienceLevel);
      data.append("focus", formData.focus);
      data.append("questionCount", formData.questionCount);
      if (resumeFile) {
        data.append("resumeFile", resumeFile);
      } else {
        data.append("resumeText", formData.resumeText);
      }

      const res = await fetch("/api/v1/interview/generate", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to generate questions");
      }

      const result = await res.json();
      
      localStorage.setItem("interviewContext", JSON.stringify({
        targetRole: formData.targetRole,
        experienceLevel: formData.experienceLevel,
        focus: formData.focus,
        resumeUrl: result.resumeUrl,
        questions: result.questions,
      }));

      router.push("/interview/session");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-[var(--cyan)]"></div>
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <div className="text-center mb-10">
        <h1 className="title-text text-4xl font-black tracking-tight mb-3">Setup New Interview</h1>
        <p className="muted-text text-lg">Provide some context so our AI can generate tailored questions.</p>
      </div>

      <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-8 shadow-xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="soft-text text-sm font-bold uppercase tracking-wider block">Target Role</label>
            <input
              type="text"
              name="targetRole"
              value={formData.targetRole}
              onChange={handleChange}
              placeholder="e.g. Frontend Engineer, Product Manager"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--cyan)] transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="soft-text text-sm font-bold uppercase tracking-wider block">Experience Level</label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--cyan)] transition-colors appearance-none"
              >
                <option value="Intern">Intern / Entry Level</option>
                <option value="Junior">Junior (1-3 yrs)</option>
                <option value="Mid">Mid-Level (3-5 yrs)</option>
                <option value="Senior">Senior (5+ yrs)</option>
                <option value="Lead">Lead / Manager</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="soft-text text-sm font-bold uppercase tracking-wider block">Interview Focus</label>
              <select
                name="focus"
                value={formData.focus}
                onChange={handleChange}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--cyan)] transition-colors appearance-none"
              >
                <option value="General">General (Mix of Technical & Behavioral)</option>
                <option value="Technical">Deep Technical / Coding</option>
                <option value="Behavioral">Behavioral / Leadership</option>
                <option value="System Design">System Architecture / Design</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="soft-text text-sm font-bold uppercase tracking-wider block">Number of Questions</label>
              <select
                name="questionCount"
                value={formData.questionCount}
                onChange={handleChange}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--cyan)] transition-colors appearance-none"
              >
                <option value="3">3 Questions</option>
                <option value="5">5 Questions</option>
                <option value="7">7 Questions</option>
                <option value="10">10 Questions</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[var(--border)]">
            <label className="soft-text text-sm font-bold uppercase tracking-wider block">Resume Context</label>
            
            {hasPrevResume && (
              <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] cursor-pointer hover:bg-[var(--surface)] transition-colors">
                <input
                  type="checkbox"
                  checked={usePrevResume}
                  onChange={(e) => setUsePrevResume(e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--cyan)] focus:ring-[var(--cyan)] bg-transparent"
                />
                <span className="text-[var(--foreground)] font-medium">Use my previous resume from last session</span>
              </label>
            )}

            {!usePrevResume && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
                <p className="text-xs text-[var(--muted)] mb-2">Upload your resume (PDF) or paste the text below. Our AI will analyze it to ask highly personalized questions about your past experience.</p>
                
                <div>
                  <input
                    type="file"
                    name="resumeFile"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-[var(--muted)]
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[var(--cyan)]/10 file:text-[var(--cyan)]
                      hover:file:bg-[var(--cyan)]/20 transition-colors"
                  />
                  {resumeFile && <p className="text-xs text-green-400 mt-2">File selected: {resumeFile.name}</p>}
                </div>

                <div className="text-center soft-text text-sm font-semibold uppercase tracking-wider">OR</div>

                <textarea
                  name="resumeText"
                  value={formData.resumeText}
                  onChange={handleChange}
                  placeholder="Paste your resume content here..."
                  className="w-full h-48 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--cyan)] transition-colors resize-none scrollbar-thin scrollbar-thumb-[var(--border)]"
                ></textarea>
              </div>
            )}
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)] rounded-2xl hover:scale-[1.02] shadow-xl hover:shadow-[var(--cyan)]/25"
            >
              <span>Begin Session</span>
              <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
