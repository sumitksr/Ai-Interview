const { createServer } = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 4000;

// Set ALLOWED_ORIGINS on Render to your Vercel URL (comma-separated)
// e.g. ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : "*";

// ── Simple HTTP server (health check + socket.io) ─────────────────────────────
const httpServer = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/" || req.url === "/check") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "AI Interview Socket Server",
        uptime: Math.floor(process.uptime()),
        rooms: rooms.size,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

// ── Room tracking: roomId → [{ socketId, userId, userName }] ─────────────────
const rooms = new Map();

function getRoomParticipants(roomId) {
  return rooms.get(roomId) || [];
}

function addParticipant(roomId, socketId, userId, userName) {
  if (!rooms.has(roomId)) rooms.set(roomId, []);
  rooms.get(roomId).push({ socketId, userId, userName });
}

function removeParticipant(roomId, socketId) {
  if (!rooms.has(roomId)) return;
  const updated = rooms.get(roomId).filter((p) => p.socketId !== socketId);
  if (updated.length === 0) {
    rooms.delete(roomId);
  } else {
    rooms.set(roomId, updated);
  }
}

// ── Socket.IO Events ──────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[${new Date().toISOString()}] CONNECT  ${socket.id}`);

  // ── Join Room ────────────────────────────────────────────────────────────
  socket.on("join-room", (roomId, userId, userName) => {
    console.log(`[JOIN]    "${userName}" → room:${roomId}`);
    socket.join(roomId);
    addParticipant(roomId, socket.id, userId, userName);

    // Tell existing participants someone new joined
    socket.to(roomId).emit("user-connected", { userId, userName });

    // Tell the new joiner who else is already in the room
    const others = getRoomParticipants(roomId).filter(
      (p) => p.socketId !== socket.id
    );
    socket.emit("room-participants", others);

    // ── Disconnect ─────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(
        `[LEAVE]   "${userName}" ← room:${roomId} (${reason})`
      );
      removeParticipant(roomId, socket.id);
      socket.to(roomId).emit("user-disconnected", { userId, userName });
    });
  });

  // ── WebRTC Signaling ─────────────────────────────────────────────────────
  socket.on("offer", ({ roomId, offer, senderId }) => {
    socket.to(roomId).emit("offer", { offer, senderId });
  });

  socket.on("answer", ({ roomId, answer, senderId }) => {
    socket.to(roomId).emit("answer", { answer, senderId });
  });

  socket.on("ice-candidate", ({ roomId, candidate, senderId }) => {
    socket.to(roomId).emit("ice-candidate", { candidate, senderId });
  });

  // ── Chat ─────────────────────────────────────────────────────────────────
  socket.on("chat-message", ({ roomId, message, senderName, senderId, timestamp }) => {
    socket.to(roomId).emit("chat-message", {
      message,
      senderName,
      senderId,
      timestamp,
    });
  });

  // ── Screen Share ──────────────────────────────────────────────────────────
  socket.on("screen-share-started", ({ roomId, userName }) => {
    socket.to(roomId).emit("screen-share-started", { userName });
  });

  socket.on("screen-share-stopped", ({ roomId }) => {
    socket.to(roomId).emit("screen-share-stopped", {});
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n✅  Socket.IO signaling server ready`);
  console.log(`    Port    : ${PORT}`);
  console.log(`    Origins : ${JSON.stringify(ALLOWED_ORIGINS)}`);
  console.log(`    Health  : http://localhost:${PORT}/health\n`);
});
