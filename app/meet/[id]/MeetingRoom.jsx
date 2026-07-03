"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";

// ─── Google Meet Style Icons ───────────────────────────────────────────────────

const MicOnIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
);
const MicOffIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10.8 4.9c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2l-.01 3.91L15 10.6V5c0-1.66-1.34-3-3-3-1.54 0-2.79 1.16-2.96 2.65l1.76 1.76V4.9zM19 11h-1.7c0 .58-.16 1.12-.42 1.6l1.32 1.32C18.73 13.06 19 12.06 19 11zM2.1 2.1L.69 3.51l5.48 5.48C5.46 9.61 5 10.27 5 11h1.7c0-1.71 1.05-3.18 2.53-3.83l2.84 2.84c-.04.31-.07.64-.07.99 0 2.76 2.24 5 5 5 .35 0 .68-.03.99-.07l3.52 3.52 1.41-1.41L2.1 2.1z"/></svg>
);
const CamOnIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
);
const CamOffIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/></svg>
);
const ScreenShareIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 16V6h16v10H4z"/></svg>
);
const ChatIcon = ({ hasUnread }) => (
  <div className="relative">
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/></svg>
    {hasUnread && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#202124]"></span>}
  </div>
);
const PhoneOffIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
);
const SendIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
);
const InfoIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
);
const PeopleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

const ICE_SERVERS = [
  // STUN servers (for direct connection attempt)
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  // TURN servers via OpenRelay (free, no signup — relays media when direct P2P fails)
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
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
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [mediaError, setMediaError] = useState(null);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const userVideoRef = useRef(null);
  const partnerVideoRef = useRef(null);
  const peerRef = useRef(null);
  const screenTrackRef = useRef(null);
  const chatEndRef = useRef(null);
  const localStreamRef = useRef(null);

  // ── Session timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
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
        setMediaError("Could not access camera or microphone.");
      }

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== "undefined" ? `http://localhost:4000` : "");
      sock = io(socketUrl, { transports: ["websocket", "polling"] });
      setSocket(sock);

      sock.emit("join-room", roomId, userId, userName);

      sock.on("room-participants", (participants) => {
        if (participants.length > 0) {
          setParticipantName(participants[0].userName || "Participant");
        }
      });

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

      sock.on("answer", ({ answer }) => {
        if (peerRef.current && peerRef.current.signalingState === "have-local-offer") {
          peerRef.current.setRemoteDescription(new RTCSessionDescription(answer)).catch((e) => console.warn("Answer Error:", e));
        }
      });

      sock.on("ice-candidate", ({ candidate }) => {
        if (peerRef.current && candidate) {
          peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
        }
      });

      sock.on("user-disconnected", ({ userName: remoteName }) => {
        setParticipantJoined(false);
        if (partnerVideoRef.current) partnerVideoRef.current.srcObject = null;
        if (peerRef.current) {
          peerRef.current.close();
          peerRef.current = null;
        }
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), system: true, text: `${remoteName || "Participant"} left the meeting.`, timestamp: Date.now() },
        ]);
      });

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

      sock.on("screen-share-started", ({ userName: n }) => {
        setIsRemoteScreenSharing(true);
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
  }, [roomId, userId, userName, createPeerConnection]);

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
        console.warn("Screen share cancelled:", err);
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#202124] text-white font-sans">
      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4 relative">
        
        {/* Video Grid */}
        <div className={`flex-1 flex justify-center items-center gap-4 transition-all duration-300 ${participantJoined ? 'flex-col md:flex-row' : ''}`}>
          
          {/* Remote Video (Only show if participant joined) */}
          {participantJoined && (
            <div className={`relative flex-1 bg-[#3c4043] rounded-xl overflow-hidden shadow-md flex justify-center items-center ${isRemoteScreenSharing ? 'md:flex-[2]' : ''} h-full max-h-full`}>
              <video
                ref={partnerVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover`}
              />
              <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-sm font-medium">{participantName}</span>
              </div>
            </div>
          )}

          {/* Local Video */}
          <div className={`relative bg-[#3c4043] rounded-xl overflow-hidden shadow-md flex justify-center items-center ${participantJoined ? 'flex-1 h-full' : 'w-full h-full max-w-5xl max-h-[80vh]'}`}>
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff && !isScreenSharing ? "opacity-0" : "opacity-100"} transform scale-x-[-1]`}
            />
            {/* Camera Off Avatar */}
            {isVideoOff && !isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#3c4043]">
                <div className="w-24 h-24 rounded-full bg-[#8ab4f8] flex items-center justify-center text-4xl font-semibold text-white shadow-lg">
                  {getInitials(userName)}
                </div>
              </div>
            )}
            {/* Screen sharing badge */}
            {isScreenSharing && (
              <div className="absolute top-4 right-4 bg-blue-600 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1">
                You are presenting
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-sm font-medium">You</span>
              {isMuted && <MicOffIcon className="w-4 h-4 text-red-500" />}
            </div>
          </div>

        </div>

        {/* ── Chat Panel (Sidebar) ── */}
        {chatOpen && (
          <div className="w-full md:w-80 bg-white text-[#202124] rounded-xl flex flex-col shadow-lg overflow-hidden shrink-0 absolute md:relative right-0 top-0 h-full z-20">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">In-call messages</h2>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <CloseIcon />
              </button>
            </div>
            
            <div className="bg-gray-50 p-3 text-xs text-gray-500 text-center border-b border-gray-200">
              Messages can only be seen by people in the call and are deleted when the call ends.
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) =>
                msg.system ? (
                  <div key={msg.id} className="text-center text-xs text-gray-400 my-2">
                    {msg.text}
                  </div>
                ) : (
                  <div key={msg.id} className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-gray-800">{msg.senderName}</span>
                      <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{msg.text}</div>
                  </div>
                )
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a message to everyone"
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="text-blue-600 disabled:text-gray-400 p-2 rounded-full hover:bg-blue-50 transition-colors"
                >
                  <SendIcon />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── Bottom Control Bar ── */}
      <div className="h-20 bg-[#202124] flex items-center justify-between px-6 shrink-0 relative z-30">
        
        {/* Left: Time & Room info */}
        <div className="flex-1 flex items-center gap-4 text-white font-medium text-sm">
          <span suppressHydrationWarning>{formatTime(currentTime)}</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">{roomId}</span>
        </div>

        {/* Center: Main Controls */}
        <div className="flex items-center gap-3">
          <ControlButton
            onClick={toggleMute}
            active={isMuted}
            icon={isMuted ? <MicOffIcon /> : <MicOnIcon />}
            activeColor="bg-[#ea4335] text-white hover:bg-[#d93025]"
            defaultColor="bg-[#3c4043] text-white hover:bg-[#4a4d51]"
          />
          <ControlButton
            onClick={toggleVideo}
            active={isVideoOff}
            icon={isVideoOff ? <CamOffIcon /> : <CamOnIcon />}
            activeColor="bg-[#ea4335] text-white hover:bg-[#d93025]"
            defaultColor="bg-[#3c4043] text-white hover:bg-[#4a4d51]"
          />
          <ControlButton
            onClick={toggleScreenShare}
            active={isScreenSharing}
            icon={<ScreenShareIcon />}
            activeColor="bg-[#8ab4f8] text-[#202124] hover:bg-[#9bbef9]"
            defaultColor="bg-[#3c4043] text-white hover:bg-[#4a4d51]"
          />
          <button
            onClick={confirmLeave}
            className="w-14 h-10 sm:w-16 sm:h-10 rounded-full bg-[#ea4335] hover:bg-[#d93025] flex items-center justify-center transition-colors ml-2"
          >
            <PhoneOffIcon />
          </button>
        </div>

        {/* Right: Side controls */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <button className="p-3 rounded-full hover:bg-[#3c4043] text-white transition-colors">
            <InfoIcon />
          </button>
          <button className="p-3 rounded-full hover:bg-[#3c4043] text-white transition-colors relative">
            <PeopleIcon />
            {participantJoined && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#5f6368] text-white text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
            )}
          </button>
          <button onClick={() => setChatOpen(!chatOpen)} className={`p-3 rounded-full transition-colors relative ${chatOpen ? 'text-[#8ab4f8]' : 'text-white hover:bg-[#3c4043]'}`}>
            <ChatIcon hasUnread={unreadCount > 0 && !chatOpen} />
          </button>
        </div>

      </div>
      
      {mediaError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#3c4043] px-6 py-3 rounded-md shadow-lg text-white text-sm z-50">
          {mediaError}
        </div>
      )}
    </div>
  );
}

// ─── ControlButton Component ──────────────────────────────────────────────────

function ControlButton({ onClick, icon, active, activeColor, defaultColor }) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${active ? activeColor : defaultColor}`}
    >
      {icon}
    </button>
  );
}
