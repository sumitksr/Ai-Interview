"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const MAX_FOLLOWUPS_PER_QUESTION = 10;
const MAX_FOLLOWUPS_GLOBAL = 20;

export default function InterviewSession() {
  const router = useRouter();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Recording & Transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Store all answers: array of strings indexed by question
  const [allAnswers, setAllAnswers] = useState([]);

  // Finishing / analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Follow-Up state ---
  const [followUpMode, setFollowUpMode] = useState(false);
  // Per-question follow-up history: array of arrays of {question, answer}
  const [followUpHistories, setFollowUpHistories] = useState([]);
  // Current active follow-up question (null = not in follow-up)
  const [activeFollowUp, setActiveFollowUp] = useState(null);
  // Counts
  const [perQuestionFollowUpCount, setPerQuestionFollowUpCount] = useState(0);
  const [globalFollowUpCount, setGlobalFollowUpCount] = useState(0);
  // Loading state for generating follow-up
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  // Whether the current main answer has been "submitted" (recorded) so we show follow-up offer
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  // Answer input mode: "record" | "type"
  const [answerMode, setAnswerMode] = useState("record");
  const [typedAnswer, setTypedAnswer] = useState("");

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const data = localStorage.getItem("interviewContext");
    if (data) {
      const parsed = JSON.parse(data);
      setContext(parsed);
      setFollowUpMode(!!parsed.enableFollowUp);
      if (parsed.questions) {
        setAllAnswers(new Array(parsed.questions.length).fill(""));
        setFollowUpHistories(new Array(parsed.questions.length).fill(null).map(() => []));
      }
    } else {
      router.push("/interview/setup");
    }
    setLoading(false);
  }, [router]);

  // Helper to start/restart the camera stream
  const initMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
  };

  useEffect(() => {
    if (!loading && context) {
      initMediaStream();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [loading, context]);

  // When transcript changes, save it into allAnswers for the current question
  useEffect(() => {
    if (transcript && !activeFollowUp) {
      setAllAnswers((prev) => {
        const updated = [...prev];
        updated[currentQuestionIndex] = transcript;
        return updated;
      });
    }
  }, [transcript, currentQuestionIndex, activeFollowUp]);

  // Reset per-question follow-up count & activeFollowUp when navigating
  const resetFollowUpForQuestion = (idx) => {
    setActiveFollowUp(null);
    setAnswerSubmitted(false);
    setAnswerMode("record");
    setTypedAnswer("");
    setPerQuestionFollowUpCount(
      (followUpHistories[idx] || []).length
    );
  };

  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;

    audioChunksRef.current = [];
    const stream = videoRef.current.srcObject;

    const audioStream = new MediaStream(stream.getAudioTracks());

    let options = { mimeType: "audio/webm" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = {};
    }

    try {
      const mediaRecorder = new MediaRecorder(audioStream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        handleTranscription(audioBlob, mimeType);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setTranscript("");
    } catch (err) {
      console.error("MediaRecorder start error:", err);
      alert("Error starting recording. Please check browser permissions and support.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (audioBlob, mimeType) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      const ext = mimeType.includes("mp4")
        ? "mp4"
        : mimeType.includes("ogg")
        ? "ogg"
        : "webm";
      formData.append("audio", audioBlob, `recording.${ext}`);

      const response = await fetch("/api/v1/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to transcribe");

      const data = await response.json();
      setTranscript(data.text);
      // After transcription in record mode, mark answer as submitted
      if (followUpMode && answerMode === "record") {
        setAnswerSubmitted(true);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      setTranscript("Error transcribing audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handle typed answer submission (no Whisper call)
  const handleTypeSubmit = () => {
    if (!typedAnswer.trim()) return;
    setTranscript(typedAnswer);
    if (followUpMode) setAnswerSubmitted(true);
  };

  const handleNavigateQuestion = (newIndex) => {
    // Save current transcript to allAnswers before navigating
    setAllAnswers((prev) => {
      const updated = [...prev];
      if (transcript && !activeFollowUp) updated[currentQuestionIndex] = transcript;
      return updated;
    });
    setCurrentQuestionIndex(newIndex);
    // Restore saved transcript for the new question
    setTranscript(allAnswers[newIndex] || "");
    resetFollowUpForQuestion(newIndex);
  };

  // --- Follow-Up logic ---
  const canRequestFollowUp =
    followUpMode &&
    answerSubmitted &&
    !isRecording &&
    !isTranscribing &&
    !isGeneratingFollowUp &&
    perQuestionFollowUpCount < MAX_FOLLOWUPS_PER_QUESTION &&
    globalFollowUpCount < MAX_FOLLOWUPS_GLOBAL;

  const handleRequestFollowUp = async () => {
    if (!canRequestFollowUp) return;

    const currentAnswer = transcript || allAnswers[currentQuestionIndex];
    if (!currentAnswer?.trim()) return;

    // Save the current follow-up answer into history using a local var
    // (avoids stale state if we read followUpHistories right after setState)
    let latestHistories = followUpHistories;
    if (activeFollowUp) {
      latestHistories = followUpHistories.map((h, i) =>
        i === currentQuestionIndex
          ? [...h, { question: activeFollowUp, answer: currentAnswer }]
          : h
      );
      setFollowUpHistories(latestHistories);
    }

    setIsGeneratingFollowUp(true);
    setActiveFollowUp(null);

    try {
      const mainQuestion = context.questions[currentQuestionIndex];
      const mainAnswer = allAnswers[currentQuestionIndex] || transcript;
      // Use latestHistories so we send the up-to-date chain (not stale state)
      const history = latestHistories[currentQuestionIndex] || [];

      const res = await fetch("/api/v1/interview/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainQuestion,
          answer: mainAnswer,
          targetRole: context.targetRole,
          experienceLevel: context.experienceLevel,
          followUpHistory: history,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate follow-up");

      const { followUpQuestion } = await res.json();

      setActiveFollowUp(followUpQuestion);
      setPerQuestionFollowUpCount((c) => c + 1);
      setGlobalFollowUpCount((c) => c + 1);
      // Clear BOTH transcript and typed answer so the input is fresh
      setTranscript("");
      setTypedAnswer("");
      setAnswerSubmitted(false);
    } catch (err) {
      console.error("Follow-up error:", err);
      alert("Failed to generate follow-up question.");
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const handleSubmitFollowUpAnswer = () => {
    if (!transcript?.trim() || !activeFollowUp) return;

    // Save follow-up answer into history
    const updatedHistories = followUpHistories.map((h, i) =>
      i === currentQuestionIndex
        ? [...h, { question: activeFollowUp, answer: transcript }]
        : h
    );
    setFollowUpHistories(updatedHistories);
    setAnswerSubmitted(true);
  };

  const handleSkipToNext = () => {
    if (!activeFollowUp && transcript) {
      // Save main question answer
      setAllAnswers((prev) => {
        const updated = [...prev];
        updated[currentQuestionIndex] = transcript;
        return updated;
      });
    } else if (activeFollowUp && transcript?.trim()) {
      // Save the active follow-up answer before skipping away
      setFollowUpHistories((prev) =>
        prev.map((h, i) =>
          i === currentQuestionIndex
            ? [...h, { question: activeFollowUp, answer: transcript }]
            : h
        )
      );
    }
    const next = currentQuestionIndex + 1;
    if (next < (context?.questions?.length || 0)) {
      setCurrentQuestionIndex(next);
      setTranscript(allAnswers[next] || "");
      resetFollowUpForQuestion(next);
    }
  };

  const handleFinishInterview = async () => {
    const finalAnswers = [...allAnswers];
    if (transcript && !activeFollowUp) finalAnswers[currentQuestionIndex] = transcript;

    // If user is finishing while an active follow-up is still open,
    // save that last follow-up answer before we flatten everything
    let latestHistories = followUpHistories;
    if (activeFollowUp && transcript?.trim()) {
      latestHistories = followUpHistories.map((h, i) =>
        i === currentQuestionIndex
          ? [...h, { question: activeFollowUp, answer: transcript }]
          : h
      );
    }

    // Flatten all main questions + their follow-up chains into one list for AI
    const flatQuestions = [];
    const flatAnswers = [];

    context.questions.forEach((q, i) => {
      flatQuestions.push(q);
      flatAnswers.push(finalAnswers[i] || "(No answer provided)");
      // Use latestHistories so the last follow-up answer is included
      const history = latestHistories[i] || [];
      history.forEach((fu) => {
        flatQuestions.push(`[Follow-up] ${fu.question}`);
        flatAnswers.push(fu.answer || "(No answer provided)");
      });
    });

    setIsAnalyzing(true);

    try {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }

      const res = await fetch("/api/v1/interview/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: flatQuestions,
          answers: flatAnswers,
          targetRole: context.targetRole,
          experienceLevel: context.experienceLevel,
          focus: context.focus,
          resumeUrl: context.resumeUrl || "",
          // Raw per-question follow-up chains for full DB storage
          followUpData: context.questions.map((q, i) => ({
            mainQuestion: q,
            mainAnswer: finalAnswers[i] || "",
            followUps: latestHistories[i] || [],  // use latestHistories here too
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const { analysis } = await res.json();

      localStorage.setItem("interviewAnalysis", JSON.stringify(analysis));
      localStorage.removeItem("interviewContext");

      router.push("/interview/results");
    } catch (error) {
      console.error("Analysis error:", error);
      setIsAnalyzing(false);
      alert("Failed to analyze interview: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-[var(--cyan)]"></div>
      </div>
    );
  }

  if (!context || !context.questions || context.questions.length === 0) {
    return (
      <div className="page-shell mx-auto max-w-3xl px-5 py-12 sm:px-8 text-center">
        <h2 className="title-text text-2xl font-bold mb-4">No questions found</h2>
        <button
          onClick={() => router.push("/interview/setup")}
          className="px-6 py-3 bg-[var(--surface-2)] text-[var(--foreground)] rounded-xl hover:bg-[var(--surface)] transition-colors"
        >
          Go Back to Setup
        </button>
      </div>
    );
  }

  // Analyzing overlay
  if (isAnalyzing) {
    return (
      <div className="page-shell flex flex-col justify-center items-center min-h-[80vh] gap-6 text-center px-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-[var(--surface-2)] border-t-[var(--cyan)]"></div>
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "var(--cyan)" }}
          ></div>
        </div>
        <div>
          <h2 className="title-text text-2xl font-bold mb-2">Analyzing Your Interview</h2>
          <p className="muted-text text-base max-w-md">
            Our AI is carefully reviewing your answers and preparing detailed feedback. This may take up to 30 seconds…
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const { targetRole, experienceLevel, focus, questions, resumeUrl } = context;
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = allAnswers.filter((a) => a && a.trim()).length;
  const followUpsThisQuestion = (followUpHistories[currentQuestionIndex] || []).length;

  // Limit badges
  const perQRemaining = MAX_FOLLOWUPS_PER_QUESTION - perQuestionFollowUpCount;
  const globalRemaining = MAX_FOLLOWUPS_GLOBAL - globalFollowUpCount;

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="page-shell mx-auto max-w-4xl px-5 py-12 sm:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="title-text text-3xl font-black tracking-tight mb-2">
            Interview Session
          </h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-3 py-1 bg-[var(--cyan)]/10 text-[var(--cyan)] rounded-full font-medium">
              {targetRole}
            </span>
            <span className="px-3 py-1 bg-[var(--surface-2)] text-[var(--muted)] rounded-full">
              {experienceLevel}
            </span>
            <span className="px-3 py-1 bg-[var(--surface-2)] text-[var(--muted)] rounded-full">
              {focus} Focus
            </span>
            {followUpMode && (
              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                Follow-Up Mode
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-[var(--muted)]">
            {answeredCount} / {questions.length} answered
          </span>
          {followUpMode && (
            <span className="text-xs text-purple-400">
              {globalFollowUpCount}/{MAX_FOLLOWUPS_GLOBAL} follow-ups used
            </span>
          )}
          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--cyan)] text-sm font-medium hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              View Resume
            </a>
          )}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-8 shadow-xl mb-8 relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--surface-2)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)] transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <span className="soft-text text-sm font-bold uppercase tracking-wider">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          {followUpMode && followUpsThisQuestion > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
              {followUpsThisQuestion} follow-up{followUpsThisQuestion !== 1 ? "s" : ""} this question
            </span>
          )}
        </div>

        {/* Active follow-up banner */}
        {activeFollowUp ? (
          <div className="mb-6 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Follow-Up #{perQuestionFollowUpCount} · {globalFollowUpCount}/{MAX_FOLLOWUPS_GLOBAL} global
              </span>
            </div>
            <p className="text-xl font-bold text-[var(--foreground)] leading-snug">
              {activeFollowUp}
            </p>
          </div>
        ) : (
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] leading-snug mb-8">
            {currentQuestion}
          </h2>
        )}

        {/* Answer Mode Toggle */}
        <div className="mb-5 flex rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] p-1 gap-1">
          <button
            onClick={async () => {
              setAnswerMode("record");
              setTypedAnswer("");
              // Re-acquire camera if stream is missing or all tracks have ended
              const srcObject = videoRef.current?.srcObject;
              const allEnded =
                !srcObject ||
                srcObject.getTracks().length === 0 ||
                srcObject.getTracks().every((t) => t.readyState === "ended");
              if (allEnded) {
                await initMediaStream();
              }
            }}
            disabled={isRecording || isTranscribing}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              answerMode === "record"
                ? "bg-blue-500 text-white shadow-md"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Record
          </button>
          <button
            onClick={() => { setAnswerMode("type"); stopRecording(); }}
            disabled={isTranscribing}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              answerMode === "type"
                ? "bg-[var(--cyan)] text-white shadow-md"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Type
          </button>
        </div>

        {answerMode === "record" ? (
          <>
            {/* Video feed */}
            <div className="mb-8 bg-[var(--surface-2)] rounded-2xl overflow-hidden border border-[var(--border)] flex justify-center relative">
              {isRecording && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  REC
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-w-[600px] h-auto object-cover transform scale-x-[-1]"
              ></video>
            </div>

            {/* Recording controls */}
            <div className="flex flex-col items-center mb-8 gap-4">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
                  Stop Recording
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={isTranscribing || isGeneratingFollowUp}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  {isTranscribing ? "Transcribing…" : "Record Answer"}
                </button>
              )}
              <p className="text-xs text-[var(--muted)]">
                {isRecording
                  ? "Recording… Click stop when done speaking"
                  : isTranscribing
                  ? "Sending audio to Whisper AI…"
                  : activeFollowUp
                  ? "Record your answer to the follow-up question"
                  : "Click to record your spoken answer"}
              </p>
            </div>
          </>
        ) : (
          /* Type mode — no paste allowed, no Whisper call */
          <div className="mb-8">
            <div className="relative">
              <textarea
                value={typedAnswer}
                onChange={(e) => {
                  setTypedAnswer(e.target.value);
                  // Live-update transcript so save indicators work
                  if (e.target.value.trim()) {
                    setTranscript(e.target.value);
                  }
                }}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                placeholder={activeFollowUp
                  ? "Type your answer to the follow-up question…"
                  : "Type your answer here… (paste is disabled)"}
                rows={6}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-5 py-4 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--cyan)] transition-colors resize-none text-sm md:text-base leading-relaxed"
              />
              {typedAnswer.length > 0 && (
                <div className="absolute bottom-3 right-4 text-xs text-[var(--muted)]">
                  {typedAnswer.length} chars
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                Paste is disabled — type your answer directly
              </p>
              <button
                onClick={handleTypeSubmit}
                disabled={!typedAnswer.trim() || answerSubmitted}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)] hover:scale-[1.02] shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {answerSubmitted ? "✓ Submitted" : "Submit Answer"}
              </button>
            </div>
          </div>
        )}

        {/* Transcript display */}
        {(isTranscribing || transcript) && (
          <div className="mb-8 p-6 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] text-left">
            <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Your Transcribed Answer
              {isTranscribing && (
                <span className="inline-block w-4 h-4 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin ml-2"></span>
              )}
            </h3>
            <p className="text-[var(--muted)] leading-relaxed text-sm md:text-base">
              {isTranscribing ? "Listening and transcribing…" : transcript}
            </p>
            {!isTranscribing && transcript && (
              <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Answer recorded — will be included in analysis
              </div>
            )}
          </div>
        )}

        {/* Previously saved answer indicator (if returning to a question) */}
        {!transcript && !isTranscribing && !activeFollowUp && allAnswers[currentQuestionIndex] && (
          <div className="mb-8 p-4 bg-green-500/5 rounded-xl border border-green-500/20 text-left">
            <p className="text-xs text-green-400 font-semibold mb-1">✓ Answer already recorded for this question</p>
            <p className="text-[var(--muted)] text-sm leading-relaxed line-clamp-3">
              {allAnswers[currentQuestionIndex]}
            </p>
            <button
              onClick={() => setTranscript(allAnswers[currentQuestionIndex])}
              className="mt-2 text-xs text-[var(--cyan)] hover:underline"
            >
              Show full answer
            </button>
          </div>
        )}

        {/* ---- Follow-Up Action Bar ---- */}
        {followUpMode && answerSubmitted && !isRecording && !isTranscribing && (
          <div className="mb-6 p-4 rounded-2xl border border-dashed border-purple-500/30 bg-purple-500/5 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <p className="text-sm text-purple-300 font-medium mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
              What would you like to do next?
            </p>
            <div className="flex flex-wrap gap-3">
              {/* Ask Follow-Up */}
              <button
                onClick={handleRequestFollowUp}
                disabled={!canRequestFollowUp || isGeneratingFollowUp}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                  bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20
                  hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isGeneratingFollowUp ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                    Ask Follow-Up
                    {!canRequestFollowUp && (perQRemaining <= 0 || globalRemaining <= 0) && (
                      <span className="text-xs opacity-75">
                        {perQRemaining <= 0 ? "(limit/question)" : "(global limit)"}
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Next Question / Finish */}
              {isLastQuestion ? (
                <button
                  onClick={handleFinishInterview}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white
                    bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] shadow-lg shadow-green-500/20 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Finish & Get Analysis
                </button>
              ) : (
                <button
                  onClick={handleSkipToNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                    bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface)] hover:scale-[1.02]"
                >
                  Next Question →
                </button>
              )}
            </div>

            {/* Limit indicators */}
            <div className="mt-3 flex gap-4 text-xs text-[var(--muted)]">
              <span>
                This question:{" "}
                <span className={perQRemaining <= 2 ? "text-amber-400 font-semibold" : "text-[var(--muted)]"}>
                  {perQuestionFollowUpCount}/{MAX_FOLLOWUPS_PER_QUESTION} follow-ups
                </span>
              </span>
              <span>
                Global:{" "}
                <span className={globalRemaining <= 3 ? "text-amber-400 font-semibold" : "text-[var(--muted)]"}>
                  {globalFollowUpCount}/{MAX_FOLLOWUPS_GLOBAL} total
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Navigation (non-follow-up mode OR follow-up mode when answer not yet submitted) */}
        {(!followUpMode || !answerSubmitted) && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => handleNavigateQuestion(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 rounded-xl font-semibold bg-[var(--surface-2)] text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface)] transition-colors"
            >
              Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => handleNavigateQuestion(currentQuestionIndex + 1)}
                className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)] hover:scale-[1.02] shadow-lg transition-all"
              >
                Next Question →
              </button>
            ) : (
              <button
                onClick={handleFinishInterview}
                disabled={isAnalyzing}
                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] shadow-lg shadow-green-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Finish & Get Analysis
              </button>
            )}
          </div>
        )}
      </div>

      {/* Questions overview */}
      <div className="bg-[var(--surface)]/40 border border-[var(--border)] rounded-2xl p-5">
        <p className="soft-text text-xs font-bold uppercase tracking-wider mb-3">Question Overview</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleNavigateQuestion(idx)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                idx === currentQuestionIndex
                  ? "bg-[var(--cyan)] text-white scale-110 shadow-lg shadow-[var(--cyan)]/30"
                  : allAnswers[idx] && allAnswers[idx].trim()
                  ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                  : "bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              }`}
            >
              {idx + 1}
              {followUpMode && (followUpHistories[idx] || []).length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                  {(followUpHistories[idx] || []).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[var(--cyan)] inline-block"></span> Current
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30 inline-block"></span> Answered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[var(--surface-2)] inline-block"></span> Not answered
          </span>
          {followUpMode && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-500/30 border border-purple-500/30 inline-block"></span> Has follow-ups
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
