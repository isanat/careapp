"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconChat, 
  IconSend,
  IconUser,
  IconPhone,
  IconVideo,
  IconMoreVertical,
  IconSearch
} from "@/components/icons";

// Chat service port
const CHAT_PORT = 3003;

interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  createdAt: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: "family" | "caregiver";
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  online: boolean;
}

// Mock conversations
const mockConversations: Conversation[] = [
  {
    id: "room-1",
    participantId: "caregiver-1",
    participantName: "Carmela Oliveira",
    participantRole: "caregiver",
    lastMessage: "Perfeito, estarei lá às 9h então!",
    lastMessageAt: "2024-01-15T10:30:00Z",
    unreadCount: 2,
    online: true,
  },
  {
    id: "room-2",
    participantId: "caregiver-2",
    participantName: "Tiago Almeida",
    participantRole: "caregiver",
    lastMessage: "Obrigado pela confiança!",
    lastMessageAt: "2024-01-14T18:45:00Z",
    unreadCount: 0,
    online: false,
  },
];

// Mock messages
const mockMessages: Message[] = [
  {
    id: "msg-1",
    chatRoomId: "room-1",
    senderId: "caregiver-1",
    senderName: "Carmela Oliveira",
    content: "Olá! Tudo bem? Vi que você tem interesse em meus serviços.",
    type: "text",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "msg-2",
    chatRoomId: "room-1",
    senderId: "family-1",
    senderName: "Você",
    content: "Olá Carmela! Sim, preciso de cuidados para minha mãe. Ela tem 82 anos.",
    type: "text",
    createdAt: "2024-01-15T10:05:00Z",
  },
  {
    id: "msg-3",
    chatRoomId: "room-1",
    senderId: "caregiver-1",
    senderName: "Carmela Oliveira",
    content: "Entendo. Tenho experiência com idosos nessa faixa etária. Qual seria o horário desejado?",
    type: "text",
    createdAt: "2024-01-15T10:15:00Z",
  },
  {
    id: "msg-4",
    chatRoomId: "room-1",
    senderId: "family-1",
    senderName: "Você",
    content: "Precisaria de segunda a sexta, das 9h às 13h.",
    type: "text",
    createdAt: "2024-01-15T10:25:00Z",
  },
  {
    id: "msg-5",
    chatRoomId: "room-1",
    senderId: "caregiver-1",
    senderName: "Carmela Oliveira",
    content: "Perfeito, estarei lá às 9h então!",
    type: "text",
    createdAt: "2024-01-15T10:30:00Z",
  },
];

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Connect to socket
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const socketUrl = `/?XTransformPort=${CHAT_PORT}`;
      const newSocket = io(socketUrl, {
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        console.log("Connected to chat server");
        newSocket.emit("join", {
          userId: session.user.id,
          userName: session.user.name,
        });
      });

      newSocket.on("message:receive", (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on("typing:indicator", (data: { userId: string; userName: string; isTyping: boolean }) => {
        setTypingUser(data.isTyping ? data.userName : null);
      });

      // Use callback to set socket after event handlers are registered
      queueMicrotask(() => setSocket(newSocket));

      return () => {
        newSocket.disconnect();
      };
    }
  }, [status, session]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      // In real app, fetch from API
      const filtered = mockMessages.filter((m) => m.chatRoomId === selectedConversation.id);
      
      // Use queueMicrotask to defer state update
      queueMicrotask(() => setMessages(filtered));
      
      // Join the room
      if (socket) {
        socket.emit("room:join", { chatRoomId: selectedConversation.id });
      }
    }
  }, [selectedConversation, socket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (socket && selectedConversation) {
      socket.emit("typing:start", { chatRoomId: selectedConversation.id });
      
      // Stop typing after 2 seconds
      setTimeout(() => {
        socket.emit("typing:stop", { chatRoomId: selectedConversation.id });
      }, 2000);
    }
  }, [socket, selectedConversation]);

  // Send message
  const handleSend = () => {
    if (!newMessage.trim() || !selectedConversation || !socket || !session?.user) return;

    const messageData = {
      chatRoomId: selectedConversation.id,
      senderId: session.user.id,
      senderName: session.user.name,
      content: newMessage.trim(),
      type: "text" as const,
      recipientId: selectedConversation.participantId,
    };

    socket.emit("message:send", messageData);
    setNewMessage("");
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-8rem)]">
        <div className="grid h-full lg:grid-cols-[300px_1fr] gap-4">
          {/* Conversations List */}
          <Card className="hidden lg:block">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mensagens</CardTitle>
                <Badge variant="secondary">{conversations.length}</Badge>
              </div>
              <div className="relative mt-2">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar conversas..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-1 p-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-3 rounded-lg text-left transition-colors hover:bg-muted ${
                        selectedConversation?.id === conv.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>
                              {conv.participantName.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          {conv.online && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conv.participantName}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(conv.lastMessageAt).toLocaleDateString("pt-PT", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                            {conv.unreadCount > 0 && (
                              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {selectedConversation.participantName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedConversation.participantName}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.online ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <IconPhone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <IconVideo className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <IconMoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.senderId !== selectedConversation.participantId;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {new Date(message.createdAt).toLocaleTimeString("pt-PT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Typing indicator */}
                    {typingUser && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <p className="text-sm text-muted-foreground">
                            {typingUser} está digitando...
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={!newMessage.trim()}>
                      <IconSend className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <IconChat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Selecione uma conversa</h3>
                  <p className="text-muted-foreground">
                    Escolha uma conversa na lista para começar
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
