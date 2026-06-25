"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";

// ─── Icons (inline SVGs) ──────────────────────────────────────────────────────

const MicOnIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const MicOffIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
  </svg>
);

const CamOnIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CamOffIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);

const ScreenShareIcon = ({ active }) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    {active ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    )}
  </svg>
);

const ChatIcon = ({ hasUnread }) => (
  <div className="relative">
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
    {hasUnread && (
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-gray-950 animate-pulse" />
    )}
  </div>
);

const PhoneOffIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatMsgTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";
}

const ROLE_COLORS = {
  mentor: { bg: "from-teal-500/20 to-cyan-500/20", badge: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  student: { bg: "from-violet-500/20 to-indigo-500/20", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
};

const ICE_STATES = {
  new: { label: "Initializing", color: "text-gray-400", dot: "bg-gray-500" },
  checking: { label: "Connecting…", color: "text-yellow-400", dot: "bg-yellow-400 animate-pulse" },
  connected: { label: "Connected", color: "text-teal-400", dot: "bg-teal-400" },
  completed: { label: "Connected", color: "text-teal-400", dot: "bg-teal-400" },
  disconnected: { label: "Reconnecting…", color: "text-orange-400", dot: "bg-orange-400 animate-pulse" },
  failed: { label: "Connection Failed", color: "text-red-400", dot: "bg-red-500 animate-pulse" },
  closed: { label: "Disconnected", color: "text-red-400", dot: "bg-red-500" },
};

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MeetingRoom({ roomId, userId, userName, role = "student", bookingInfo = {} }) {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantJoined, setParticipantJoined] = useState(false);
  const [participantName, setParticipantName] = useState("Participant");
  const [participantRole, setParticipantRole] = useState("student");
  const [iceState, setIceState] = useState("new");
  const [elapsed, setElapsed] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);

  const userVideoRef = useRef(null);
  const partnerVideoRef = useRef(null);
  const peerRef = useRef(null);
  const screenTrackRef = useRef(null);
  const chatEndRef = useRef(null);
  const localStreamRef = useRef(null);

  // ── Session timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Clear unread when chat opened ──────────────────────────────────────────
  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  // ── WebRTC peer factory ────────────────────────────────────────────────────
  const createPeerConnection = useCallback((sock) => {
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    peer.oniceconnectionstatechange = () => {
      setIceState(peer.iceConnectionState);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sock.emit("ice-candidate", { candidate: event.candidate, roomId, senderId: sock.id });
      }
    };

    peer.ontrack = (event) => {
      if (partnerVideoRef.current) {
        partnerVideoRef.current.srcObject = event.streams[0];
      }
      setParticipantJoined(true);
    };

    return peer;
  }, [roomId]);

  // ── Main socket + media setup ──────────────────────────────────────────────
  useEffect(() => {
    let sock;
    let stream;

    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (userVideoRef.current) userVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera/Mic access denied:", err);
        setMediaError("Could not access camera or microphone. Please check your browser permissions.");
        // Still try to join room without local media
      }

      sock = io(window.location.origin, { transports: ["websocket", "polling"] });
      setSocket(sock);

      sock.emit("join-room", roomId, userId, userName);

      // ── Room participants already there ──────────────────────────────────
      sock.on("room-participants", (participants) => {
        if (participants.length > 0) {
          setParticipantName(participants[0].userName || "Participant");
        }
      });

      // ── New user joined — we (existing user) create the offer ────────────
      sock.on("user-connected", ({ userId: remoteId, userName: remoteName }) => {
        setParticipantName(remoteName || "Participant");

        const peer = createPeerConnection(sock);
        peerRef.current = peer;

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            peer.addTrack(track, localStreamRef.current);
          });
        }

        peer.createOffer().then((offer) => {
          peer.setLocalDescription(offer);
          sock.emit("offer", { offer, roomId, senderId: sock.id });
        });
      });

      // ── Received offer — answer it ───────────────────────────────────────
      sock.on("offer", async ({ offer, senderId }) => {
        const peer = createPeerConnection(sock);
        peerRef.current = peer;

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            peer.addTrack(track, localStreamRef.current);
          });
        }

        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        sock.emit("answer", { answer, roomId, senderId: sock.id });
      });

      // ── Received answer ──────────────────────────────────────────────────
      sock.on("answer", ({ answer }) => {
        peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
      });

      // ── ICE candidates ───────────────────────────────────────────────────
      sock.on("ice-candidate", ({ candidate }) => {
        if (peerRef.current && candidate) {
          peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
        }
      });

      // ── Participant left ─────────────────────────────────────────────────
      sock.on("user-disconnected", ({ userName: remoteName }) => {
        setParticipantJoined(false);
        setIceState("closed");
        if (partnerVideoRef.current) partnerVideoRef.current.srcObject = null;
        if (peerRef.current) {
          peerRef.current.close();
          peerRef.current = null;
        }
        // Add system message to chat
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), system: true, text: `${remoteName || "Participant"} left the meeting.`, timestamp: Date.now() },
        ]);
      });

      // ── Chat ─────────────────────────────────────────────────────────────
      sock.on("chat-message", ({ message, senderName, senderId, timestamp }) => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), text: message, senderName, senderId, timestamp, mine: false },
        ]);
        setChatOpen((open) => {
          if (!open) setUnreadCount((n) => n + 1);
          return open;
        });
      });

      // ── Screen share ─────────────────────────────────────────────────────
      sock.on("screen-share-started", ({ userName: n }) => {
        setIsRemoteScreenSharing(true);
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), system: true, text: `${n || "Participant"} started screen sharing.`, timestamp: Date.now() },
        ]);
      });

      sock.on("screen-share-stopped", () => {
        setIsRemoteScreenSharing(false);
      });
    };

    init();

    return () => {
      if (sock) sock.disconnect();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenTrackRef.current) screenTrackRef.current.stop();
      if (peerRef.current) peerRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, userName]);

  // ── Controls ───────────────────────────────────────────────────────────────

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share, restore camera
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack && peerRef.current) {
        const sender = peerRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(cameraTrack);
      }
      if (userVideoRef.current && localStreamRef.current) {
        userVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
      socket?.emit("screen-share-stopped", { roomId });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        if (peerRef.current) {
          const sender = peerRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(screenTrack);
        }

        // Show screen locally too
        if (userVideoRef.current) {
          const composed = new MediaStream([
            screenTrack,
            ...(localStreamRef.current?.getAudioTracks() || []),
          ]);
          userVideoRef.current.srcObject = composed;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
        socket?.emit("screen-share-started", { roomId, userName });
      } catch (err) {
        console.warn("Screen share cancelled or denied:", err);
      }
    }
  };

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !socket) return;
    const msg = {
      id: Date.now(),
      text: chatInput.trim(),
      senderName: userName,
      senderId: userId,
      timestamp: Date.now(),
      mine: true,
    };
    setMessages((prev) => [...prev, msg]);
    socket.emit("chat-message", { roomId, message: msg.text, senderName: userName, senderId: userId, timestamp: msg.timestamp });
    setChatInput("");
  };

  const confirmLeave = () => {
    if (socket) socket.disconnect();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    if (screenTrackRef.current) screenTrackRef.current.stop();
    if (peerRef.current) peerRef.current.close();
    window.location.href = "/dashboard";
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const myColors = ROLE_COLORS[role] || ROLE_COLORS.student;
  const partRole = role === "mentor" ? "student" : "mentor";
  const partColors = ROLE_COLORS[partRole] || ROLE_COLORS.student;
  const iceInfo = ICE_STATES[iceState] || ICE_STATES.new;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-[#05070d] text-white font-sans relative">

      {/* ─── Ambient background ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      {/* ─── Main area ───────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#080b14]/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <svg className="w-4 h-4 text-[#041016]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">AI Interview</p>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5">Live Session</p>
              </div>
            </div>

            {/* Session info */}
            {bookingInfo.startTime && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{bookingInfo.startTime} – {bookingInfo.endTime}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Live dot + timer */}
            <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
              </span>
              <span className="text-xs font-mono font-semibold text-teal-300 tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>

            {/* Connection status */}
            {participantJoined && (
              <div className={`hidden sm:flex items-center gap-1.5 text-xs ${iceInfo.color} bg-white/5 px-3 py-1.5 rounded-full border border-white/5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${iceInfo.dot}`} />
                {iceInfo.label}
              </div>
            )}

            {/* My role badge */}
            <div className={`hidden sm:flex items-center text-xs px-3 py-1.5 rounded-full border font-semibold capitalize ${myColors.badge}`}>
              {role}
            </div>
          </div>
        </header>

        {/* ── Media error banner ───────────────────────────────────────────── */}
        {mediaError && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-3 shrink-0">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{mediaError}</span>
          </div>
        )}

        {/* ── Video grid ───────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-hidden p-4 md:p-6">
          <div className={`h-full grid gap-4 ${participantJoined ? "md:grid-cols-2" : "grid-cols-1 max-w-3xl mx-auto"}`}>

            {/* ─ Remote video ──────────────────────────────────────────────── */}
            <div className={`relative rounded-2xl overflow-hidden bg-[#0a0f1c] border border-white/5 shadow-2xl transition-all duration-500 ${!participantJoined ? "hidden md:flex" : ""}`}>
              <video
                ref={partnerVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-500 ${participantJoined ? "opacity-100" : "opacity-0"}`}
              />

              {/* Waiting state */}
              {!participantJoined && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${partColors.bg} to-transparent`}>
                  <div className="relative mb-5">
                    <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-teal-400 animate-spin" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Waiting for participant…</p>
                  <p className="text-xs text-gray-600 mt-1">Share your room link to invite them</p>
                </div>
              )}

              {/* Remote screen share indicator */}
              {isRemoteScreenSharing && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-violet-500/20 text-violet-300 text-xs px-3 py-1.5 rounded-full border border-violet-500/30 backdrop-blur-sm">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Screen Sharing
                </div>
              )}

              {/* Remote participant label */}
              {participantJoined && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md text-sm font-medium border border-white/10 flex items-center gap-2`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-teal-400`} />
                    <span>{participantName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${partColors.badge}`}>{partRole}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ─ Local video ───────────────────────────────────────────────── */}
            <div className={`relative rounded-2xl overflow-hidden bg-[#0a0f1c] border border-white/5 shadow-2xl ${participantJoined ? "" : "aspect-video"}`}>
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff && !isScreenSharing ? "opacity-0" : "opacity-100"}`}
              />

              {/* Camera off avatar */}
              {isVideoOff && !isScreenSharing && (
                <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${myColors.bg}`}>
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-bold text-gray-300 shadow-inner backdrop-blur-sm">
                    {getInitials(userName)}
                  </div>
                </div>
              )}

              {/* Screen share badge */}
              {isScreenSharing && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-teal-500/20 text-teal-300 text-xs px-3 py-1.5 rounded-full border border-teal-500/30 backdrop-blur-sm">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Sharing Screen
                </div>
              )}

              {/* Local label */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md text-sm font-medium border border-white/10 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span>You ({userName})</span>
                  {isMuted && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">Muted</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* ── Controls bar ─────────────────────────────────────────────────── */}
        <footer className="shrink-0 px-6 pb-6 pt-3 flex items-center justify-center gap-3 bg-[#080b14]/60 backdrop-blur-xl border-t border-white/5">
          
          {/* Mute */}
          <ControlButton
            onClick={toggleMute}
            label={isMuted ? "Unmute" : "Mute"}
            active={isMuted}
            activeClass="bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
            defaultClass="bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
          >
            {isMuted ? <MicOffIcon /> : <MicOnIcon />}
          </ControlButton>

          {/* Camera */}
          <ControlButton
            onClick={toggleVideo}
            label={isVideoOff ? "Start Video" : "Stop Video"}
            active={isVideoOff}
            activeClass="bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
            defaultClass="bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
          >
            {isVideoOff ? <CamOffIcon /> : <CamOnIcon />}
          </ControlButton>

          {/* Screen share */}
          <ControlButton
            onClick={toggleScreenShare}
            label={isScreenSharing ? "Stop Sharing" : "Share Screen"}
            active={isScreenSharing}
            activeClass="bg-teal-500/20 text-teal-400 border-teal-500/40 hover:bg-teal-500/30"
            defaultClass="bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
          >
            <ScreenShareIcon active={isScreenSharing} />
          </ControlButton>

          {/* Chat */}
          <ControlButton
            onClick={() => setChatOpen((o) => !o)}
            label="Chat"
            active={chatOpen}
            activeClass="bg-teal-500/20 text-teal-400 border-teal-500/40"
            defaultClass="bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
          >
            <ChatIcon hasUnread={unreadCount > 0} />
          </ControlButton>

          {/* Divider */}
          <div className="w-px h-10 bg-white/10 mx-1" />

          {/* Leave */}
          <button
            onClick={() => setShowLeaveDialog(true)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
          >
            <PhoneOffIcon />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </footer>
      </div>

      {/* ─── Chat panel ──────────────────────────────────────────────────────── */}
      <div className={`fixed sm:relative top-0 right-0 h-full w-full sm:w-80 flex flex-col border-l border-white/5 bg-[#080b14] transition-transform duration-300 ease-out z-30 ${chatOpen ? "translate-x-0" : "translate-x-full sm:translate-x-full"}`}>
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-semibold text-sm">Meeting Chat</span>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-xs text-gray-600">No messages yet.<br />Say hello!</p>
            </div>
          )}

          {messages.map((msg) =>
            msg.system ? (
              <div key={msg.id} className="flex justify-center">
                <span className="text-[10px] text-gray-600 bg-white/5 px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            ) : (
              <div key={msg.id} className={`flex flex-col gap-1 ${msg.mine ? "items-end" : "items-start"}`}>
                {!msg.mine && (
                  <span className="text-[10px] text-gray-500 px-1">{msg.senderName}</span>
                )}
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.mine
                      ? "bg-teal-500/20 text-teal-100 border border-teal-500/20 rounded-br-sm"
                      : "bg-white/5 text-gray-200 border border-white/5 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-600 px-1">{formatMsgTime(msg.timestamp)}</span>
              </div>
            )
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <form onSubmit={sendMessage} className="flex items-center gap-2 p-4 border-t border-white/5 shrink-0">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#041016] transition-all duration-200 active:scale-95"
          >
            <SendIcon />
          </button>
        </form>
      </div>

      {/* ─── Leave dialog ─────────────────────────────────────────────────────── */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <PhoneOffIcon />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Leave Meeting?</h2>
                <p className="text-sm text-gray-400 mt-1">
                  You will be disconnected from this session. The other participant will be notified.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLeaveDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/5 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors shadow-lg shadow-red-500/20"
              >
                Leave Meeting
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── ControlButton helper ─────────────────────────────────────────────────────

function ControlButton({ children, onClick, label, active, activeClass, defaultClass }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 border active:scale-95 ${active ? activeClass : defaultClass}`}
      >
        {children}
      </button>
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform origin-bottom bg-[#101827] text-xs px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap text-gray-200 pointer-events-none">
        {label}
      </span>
    </div>
  );
}
