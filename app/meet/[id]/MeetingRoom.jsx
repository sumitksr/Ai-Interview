"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

export default function MeetingRoom({ roomId, userId, userName }) {
  const [socket, setSocket] = useState(null);
  const [stream, setStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participantJoined, setParticipantJoined] = useState(false);
  
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();

  useEffect(() => {
    // We assume socket.io server is running on same host/port
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }

      newSocket.emit("join-room", roomId, userId);

      newSocket.on("user-connected", (newUserId) => {
        setParticipantJoined(true);
        // A new user joined, we are the existing user, we should create an offer
        const peer = createPeer(newUserId, newSocket.id, currentStream, newSocket);
        peerRef.current = peer;
      });

      newSocket.on("offer", (data) => {
        setParticipantJoined(true);
        // We receive an offer from the existing user in the room
        const peer = addPeer(data.offer, data.senderId, currentStream, newSocket);
        peerRef.current = peer;
      });

      newSocket.on("answer", (data) => {
        // We receive an answer
        if (peerRef.current) {
          peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      newSocket.on("ice-candidate", (data) => {
        if (peerRef.current) {
          peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      newSocket.on("user-disconnected", () => {
        setParticipantJoined(false);
        if (partnerVideo.current) {
          partnerVideo.current.srcObject = null;
        }
        if (peerRef.current) {
          peerRef.current.close();
          peerRef.current = null;
        }
      });
    }).catch(err => {
      console.error("Failed to get local stream", err);
    });

    return () => {
      newSocket.disconnect();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId]);

  function createPeer(userToSignal, callerId, stream, socket) {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          roomId,
          senderId: callerId,
        });
      }
    };

    peer.ontrack = (event) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = event.streams[0];
      }
    };

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.createOffer().then((offer) => {
      peer.setLocalDescription(offer);
      socket.emit("offer", {
        offer,
        roomId,
        senderId: callerId,
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerId, stream, socket) {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          roomId,
          senderId: socket.id,
        });
      }
    };

    peer.ontrack = (event) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = event.streams[0];
      }
    };

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.setRemoteDescription(new RTCSessionDescription(incomingSignal)).then(() => {
      peer.createAnswer().then((answer) => {
        peer.setLocalDescription(answer);
        socket.emit("answer", {
          answer,
          roomId,
          senderId: socket.id,
        });
      });
    });

    return peer;
  }

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const leaveMeeting = () => {
    if (socket) socket.disconnect();
    if (stream) stream.getTracks().forEach(track => track.stop());
    window.location.href = '/dashboard'; // Or wherever they should go after
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 backdrop-blur-md">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 tracking-tight">
          AI Interview Meeting
        </h1>
        <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-300">Live Session</span>
        </div>
      </header>

      {/* Video Grid */}
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-7xl h-full md:h-auto max-h-full">
          {/* Local Video */}
          <div className="relative rounded-3xl overflow-hidden bg-gray-900 aspect-video ring-1 ring-gray-800 shadow-2xl group transition-all duration-300 hover:ring-gray-700">
            <video
              ref={userVideo}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="w-24 h-24 rounded-full bg-gray-700/50 flex items-center justify-center text-4xl font-bold text-gray-300 backdrop-blur-sm border border-gray-600 shadow-inner">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            )}
            <div className="absolute bottom-6 left-6 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-md text-sm font-medium border border-white/10 flex items-center gap-2">
              <span>You</span>
              {isMuted && <span className="text-red-400 text-xs bg-red-400/10 px-2 py-0.5 rounded">Muted</span>}
            </div>
          </div>

          {/* Remote Video */}
          <div className="relative rounded-3xl overflow-hidden bg-gray-900 aspect-video ring-1 ring-gray-800 shadow-2xl transition-all duration-300">
            <video
              ref={partnerVideo}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${participantJoined ? 'opacity-100' : 'opacity-0'}`}
            />
            {!participantJoined && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-0 bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
                  <svg className="w-8 h-8 text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 font-medium tracking-wide">Waiting for participant to join...</p>
              </div>
            )}
            {participantJoined && (
              <div className="absolute bottom-6 left-6 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-md text-sm font-medium border border-white/10">
                Participant
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Controls Bar */}
      <footer className="p-6 bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 flex justify-center gap-6 pb-8">
        <button
          onClick={toggleMute}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
            isMuted 
              ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' 
              : 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 hover:border-gray-600'
          }`}
        >
          {isMuted ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
          <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-gray-800 text-xs px-2 py-1 rounded shadow-lg border border-gray-700 whitespace-nowrap">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </button>

        <button
          onClick={toggleVideo}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
            isVideoOff 
              ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' 
              : 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 hover:border-gray-600'
          }`}
        >
          {isVideoOff ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          ) : (
             <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-gray-800 text-xs px-2 py-1 rounded shadow-lg border border-gray-700 whitespace-nowrap">
            {isVideoOff ? 'Start Video' : 'Stop Video'}
          </span>
        </button>

        <button
          onClick={leaveMeeting}
          className="w-16 h-16 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] ml-4 group relative"
        >
          <svg className="w-7 h-7 transform rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-gray-800 text-xs px-2 py-1 rounded shadow-lg border border-gray-700 whitespace-nowrap">
            Leave Meeting
          </span>
        </button>
      </footer>
    </div>
  );
}
