import { createServer } from "http";
import { Server } from "socket.io";
import { createHmac } from "crypto";

const PORT = 3003;
const CHAT_TOKEN_SECRET = process.env.CHAT_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || 'default-chat-secret';

// Verify HMAC-signed chat token
function verifyChatToken(token: string): { userId: string; userName: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;

    // Verify signature
    const expectedSignature = createHmac('sha256', CHAT_TOKEN_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    if (signature !== expectedSignature) {
      console.log('Invalid token signature');
      return null;
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString());

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('Token expired');
      return null;
    }

    return { userId: payload.userId, userName: payload.userName };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://idosolink.com",
      /\.space\.z\.ai$/,
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Authenticate socket connections via middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication token required"));
  }

  const user = verifyChatToken(token);
  if (!user) {
    return next(new Error("Invalid or expired token"));
  }

  // Attach verified user data to socket
  socket.data.userId = user.userId;
  socket.data.userName = user.userName;
  next();
});

// Store connected users
const connectedUsers = new Map<string, string>(); // userId -> socketId

// Message types
interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  createdAt: string;
}

interface TypingIndicator {
  chatRoomId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

io.on("connection", (socket) => {
  console.log(`Authenticated user connected: ${socket.data.userName} (${socket.data.userId})`);

  // Store user connection (already authenticated via middleware)
  connectedUsers.set(socket.data.userId, socket.id);
  socket.join(`user:${socket.data.userId}`);
  io.emit("user:online", { userId: socket.data.userId, userName: socket.data.userName });

  // Join a chat room
  socket.on("room:join", (data: { chatRoomId: string }) => {
    console.log(`User ${socket.data.userName} joined room ${data.chatRoomId}`);
    socket.join(`room:${data.chatRoomId}`);
    
    // Notify others in room
    socket.to(`room:${data.chatRoomId}`).emit("user:joined", {
      userId: socket.data.userId,
      userName: socket.data.userName,
      timestamp: new Date().toISOString(),
    });
  });

  // Leave a chat room
  socket.on("room:leave", (data: { chatRoomId: string }) => {
    console.log(`User ${socket.data.userName} left room ${data.chatRoomId}`);
    socket.leave(`room:${data.chatRoomId}`);
    
    socket.to(`room:${data.chatRoomId}`).emit("user:left", {
      userId: socket.data.userId,
      userName: socket.data.userName,
      timestamp: new Date().toISOString(),
    });
  });

  // Send message
  socket.on("message:send", (data: {
    chatRoomId: string;
    senderId: string;
    senderName: string;
    content: string;
    type: "text" | "image" | "file";
    recipientId?: string;
  }) => {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      chatRoomId: data.chatRoomId,
      senderId: data.senderId,
      senderName: data.senderName,
      content: data.content,
      type: data.type,
      createdAt: new Date().toISOString(),
    };

    console.log(`Message in room ${data.chatRoomId}: ${data.content}`);

    // Emit to everyone in the room
    io.to(`room:${data.chatRoomId}`).emit("message:receive", message);

    // Also send notification to recipient if offline
    if (data.recipientId) {
      const recipientSocketId = connectedUsers.get(data.recipientId);
      if (recipientSocketId) {
        // User is online, already received via room
      } else {
        // User is offline - could store in DB for later retrieval
        // For now, we'll emit to their personal room
        io.to(`user:${data.recipientId}`).emit("notification:message", {
          message,
        });
      }
    }
  });

  // Typing indicator
  socket.on("typing:start", (data: { chatRoomId: string }) => {
    socket.to(`room:${data.chatRoomId}`).emit("typing:indicator", {
      chatRoomId: data.chatRoomId,
      userId: socket.data.userId,
      userName: socket.data.userName,
      isTyping: true,
    } as TypingIndicator);
  });

  socket.on("typing:stop", (data: { chatRoomId: string }) => {
    socket.to(`room:${data.chatRoomId}`).emit("typing:indicator", {
      chatRoomId: data.chatRoomId,
      userId: socket.data.userId,
      userName: socket.data.userName,
      isTyping: false,
    } as TypingIndicator);
  });

  // Mark messages as read
  socket.on("messages:read", (data: { chatRoomId: string; messageIds: string[] }) => {
    socket.to(`room:${data.chatRoomId}`).emit("messages:read", {
      chatRoomId: data.chatRoomId,
      readerId: socket.data.userId,
      messageIds: data.messageIds,
      readAt: new Date().toISOString(),
    });
  });

  // Get online users
  socket.on("users:online", () => {
    const onlineUsers = Array.from(connectedUsers.entries()).map(([userId]) => userId);
    socket.emit("users:online:list", onlineUsers);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (socket.data.userId) {
      connectedUsers.delete(socket.data.userId);
      io.emit("user:offline", { userId: socket.data.userId });
    }
  });
});

// Health check endpoint
httpServer.on("request", (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", connectedUsers: connectedUsers.size }));
  }
});

httpServer.listen(PORT, () => {
  console.log(`Chat service running on port ${PORT}`);
});
