import { createServer } from "http";
import { parse as parseUrl } from "url";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import next from "next";
import path from "path";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// JWT secret - should match the one in auth config
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

interface SocketUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Track active users in rooms
const roomUsers = new Map<string, Set<string>>();
const userSockets = new Map<string, string>();

async function startServer() {
  // Create next app
  const app = next({ dev, hostname, port, dir: path.resolve(process.cwd()) });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parseUrl(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: no token"));
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.data.user = {
        id: decoded.sub || decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      };
      next();
    } catch (err) {
      console.error("Token verification failed:", err);
      next(new Error("Authentication error: invalid token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const userId = socket.data.user?.id;
    console.log(`[Socket.IO] User connected: ${userId} (socket: ${socket.id})`);

    // Store socket mapping
    if (userId) {
      userSockets.set(userId, socket.id);
    }

    // Handle room join
    socket.on("room:join", (data: { chatRoomId: string }) => {
      const { chatRoomId } = data;
      socket.join(`chat:${chatRoomId}`);

      // Track users in room
      if (!roomUsers.has(chatRoomId)) {
        roomUsers.set(chatRoomId, new Set());
      }
      if (userId) {
        roomUsers.get(chatRoomId)!.add(userId);
      }

      console.log(`[Socket.IO] User ${userId} joined room: ${chatRoomId}`);
    });

    // Handle room leave
    socket.on("room:leave", (data: { chatRoomId: string }) => {
      const { chatRoomId } = data;
      socket.leave(`chat:${chatRoomId}`);

      // Remove user from room tracking
      if (userId && roomUsers.has(chatRoomId)) {
        roomUsers.get(chatRoomId)!.delete(userId);
        if (roomUsers.get(chatRoomId)!.size === 0) {
          roomUsers.delete(chatRoomId);
        }
      }

      console.log(`[Socket.IO] User ${userId} left room: ${chatRoomId}`);
    });

    // Handle message sending
    socket.on("message:send", async (data: {
      chatRoomId: string;
      content: string;
      messageType?: string;
      senderId: string;
      senderName: string;
      recipientId?: string;
    }) => {
      const { chatRoomId, content, messageType = "text", senderId, senderName } = data;

      // Broadcast to all users in the room
      io.to(`chat:${chatRoomId}`).emit("message:receive", {
        id: `msg_${Date.now()}`,
        chatRoomId,
        senderId,
        senderName,
        content,
        messageType,
        createdAt: new Date().toISOString(),
      });

      console.log(`[Socket.IO] Message sent in room ${chatRoomId}: ${content.substring(0, 50)}`);
    });

    // Handle typing indicator
    socket.on("typing:start", (data: { chatRoomId: string }) => {
      const { chatRoomId } = data;
      io.to(`chat:${chatRoomId}`).emit("typing:indicator", {
        userId,
        userName: socket.data.user?.name,
        isTyping: true,
      });
    });

    socket.on("typing:stop", (data: { chatRoomId: string }) => {
      const { chatRoomId } = data;
      io.to(`chat:${chatRoomId}`).emit("typing:indicator", {
        userId,
        userName: socket.data.user?.name,
        isTyping: false,
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`[Socket.IO] User disconnected: ${userId} (socket: ${socket.id})`);

      // Remove from user sockets map
      if (userId) {
        userSockets.delete(userId);
      }

      // Notify all rooms user was in
      roomUsers.forEach((users, chatRoomId) => {
        if (userId && users.has(userId)) {
          users.delete(userId);
          if (users.size === 0) {
            roomUsers.delete(chatRoomId);
          }
        }
      });
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`[Socket.IO] Socket error for user ${userId}:`, error);
    });
  });

  // Start server
  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    if (dev) {
      console.log(`> Socket.IO server running on ws://${hostname}:${port}`);
    }
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
