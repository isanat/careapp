import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3003;

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
  console.log(`User connected: ${socket.id}`);

  // User authentication/join
  socket.on("join", (data: { userId: string; userName: string }) => {
    console.log(`User ${data.userName} (${data.userId}) joined`);
    
    // Store user connection
    connectedUsers.set(data.userId, socket.id);
    socket.data.userId = data.userId;
    socket.data.userName = data.userName;
    
    // Join user's personal room for notifications
    socket.join(`user:${data.userId}`);
    
    // Emit online status
    io.emit("user:online", { userId: data.userId, userName: data.userName });
  });

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
