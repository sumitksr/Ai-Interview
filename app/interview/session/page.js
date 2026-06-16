"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function InterviewSession() {
  const router = useRouter();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Recording & Transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const data = localStorage.getItem("interviewContext");
    if (data) {
      setContext(JSON.parse(data));
    } else {
      // If no context, redirect back to setup
      router.push("/interview/setup");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    }
    
    // Only setup media when context is loaded and we are not loading
    if (!loading && context) {
      setupMedia();
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [loading, context]);

  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    
    audioChunksRef.current = [];
    const stream = videoRef.current.srcObject;
    
    // Use only audio tracks to avoid mimeType conflicts with video
    const audioStream = new MediaStream(stream.getAudioTracks());
    
    let options = { mimeType: 'audio/webm' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = {}; // Fallback to default audio format
    }
    
    try {
      const mediaRecorder = new MediaRecorder(audioStream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
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
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      formData.append("audio", audioBlob, `recording.${ext}`);

      const response = await fetch("/api/v1/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to transcribe");
      }

      const data = await response.json();
      setTranscript(data.text);
    } catch (error) {
      console.error("Transcription error:", error);
      setTranscript("Error transcribing audio. Please try again.");
    } finally {
      setIsTranscribing(false);
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

  const { targetRole, experienceLevel, focus, questions, resumeUrl } = context;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="page-shell mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="title-text text-3xl font-black tracking-tight mb-2">Interview Session</h1>
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
          </div>
        </div>
        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--cyan)] text-sm font-medium hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            View Uploaded Resume
          </a>
        )}
      </div>

      <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl p-8 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--surface-2)]">
          <div 
            className="h-full bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)] transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="mb-6 soft-text text-sm font-bold uppercase tracking-wider">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] leading-snug mb-8">
          {currentQuestion}
        </h2>

        <div className="mb-8 bg-[var(--surface-2)] rounded-2xl overflow-hidden border border-[var(--border)] flex justify-center relative">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full max-w-[600px] h-auto object-cover transform scale-x-[-1]"
          ></video>
        </div>

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
               className="px-6 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center gap-2"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
               Record Answer
             </button>
           )}
        </div>

        {(isTranscribing || transcript) && (
          <div className="mb-8 p-6 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] text-left">
            <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              Your Transcription 
              {isTranscribing && <span className="inline-block w-4 h-4 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin ml-2"></span>}
            </h3>
            <p className="text-[var(--muted)] leading-relaxed text-sm md:text-base">
              {isTranscribing ? "Listening and transcribing..." : transcript}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--border)]">
          <button
            onClick={() => {
              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
              setTranscript("");
            }}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 rounded-xl font-semibold bg-[var(--surface-2)] text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface)] transition-colors"
          >
            Previous
          </button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() => {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setTranscript("");
              }}
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[var(--cyan)] to-[var(--accent)] hover:scale-[1.02] shadow-lg transition-all"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={() => {
                alert("Session complete! We'll save your progress (to be implemented).");
                router.push("/dashboard");
              }}
              className="px-8 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-all"
            >
              Finish Interview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
