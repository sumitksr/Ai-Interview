const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Track room participants: roomId -> [{ socketId, userId, userName }]
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Join Room ──────────────────────────────────────────────────────────
    socket.on("join-room", (roomId, userId, userName) => {
      console.log(`User "${userName}" (${userId}) joining room ${roomId}`);
      socket.join(roomId);

      // Store participant info
      if (!rooms.has(roomId)) rooms.set(roomId, []);
      rooms.get(roomId).push({ socketId: socket.id, userId, userName });

      // Notify others in the room that a new user joined (with their name)
      socket.to(roomId).emit("user-connected", { userId, userName });

      // Send current participants list back to the joining user
      const others = rooms.get(roomId).filter((p) => p.socketId !== socket.id);
      socket.emit("room-participants", others);

      // ── Disconnect ─────────────────────────────────────────────────────
      socket.on("disconnect", () => {
        console.log(`User "${userName}" disconnected from room ${roomId}`);

        // Remove from room tracking
        if (rooms.has(roomId)) {
          const updated = rooms
            .get(roomId)
            .filter((p) => p.socketId !== socket.id);
          if (updated.length === 0) {
            rooms.delete(roomId);
          } else {
            rooms.set(roomId, updated);
          }
        }

        socket.to(roomId).emit("user-disconnected", { userId, userName });
      });
    });

    // ── WebRTC Signaling ───────────────────────────────────────────────────
    socket.on("offer", (data) => {
      socket.to(data.roomId).emit("offer", {
        offer: data.offer,
        senderId: data.senderId,
      });
    });

    socket.on("answer", (data) => {
      socket.to(data.roomId).emit("answer", {
        answer: data.answer,
        senderId: data.senderId,
      });
    });

    socket.on("ice-candidate", (data) => {
      socket.to(data.roomId).emit("ice-candidate", {
        candidate: data.candidate,
        senderId: data.senderId,
      });
    });

    // ── Chat ───────────────────────────────────────────────────────────────
    socket.on("chat-message", (data) => {
      // data: { roomId, message, senderName, senderId, timestamp }
      socket.to(data.roomId).emit("chat-message", {
        message: data.message,
        senderName: data.senderName,
        senderId: data.senderId,
        timestamp: data.timestamp,
      });
    });

    // ── Screen Share ───────────────────────────────────────────────────────
    socket.on("screen-share-started", (data) => {
      // data: { roomId, userName }
      socket.to(data.roomId).emit("screen-share-started", {
        userName: data.userName,
      });
    });

    socket.on("screen-share-stopped", (data) => {
      socket.to(data.roomId).emit("screen-share-stopped", {});
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
