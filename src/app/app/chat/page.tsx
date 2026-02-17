"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconChat, 
  IconSend,
  IconPhone,
  IconVideo,
  IconMoreVertical,
  IconSearch,
  IconRefresh
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
  participant: {
    id: string;
    name: string;
    role: string;
    title?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/rooms');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.chatRooms || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (chatRoomId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/messages?chatRoomId=${chatRoomId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

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

      queueMicrotask(() => setSocket(newSocket));

      return () => {
        newSocket.disconnect();
      };
    }
  }, [status, session]);

  // Load conversations on mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
    }
  }, [status, fetchConversations]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Join the room via socket
      if (socket) {
        socket.emit("room:join", { chatRoomId: selectedConversation.id });
      }
    }
  }, [selectedConversation, socket, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (socket && selectedConversation) {
      socket.emit("typing:start", { chatRoomId: selectedConversation.id });
      
      setTimeout(() => {
        socket.emit("typing:stop", { chatRoomId: selectedConversation.id });
      }, 2000);
    }
  }, [socket, selectedConversation]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || !session?.user) return;

    const messageData = {
      chatRoomId: selectedConversation.id,
      senderId: session.user.id,
      senderName: session.user.name,
      content: newMessage.trim(),
      type: "text" as const,
      recipientId: selectedConversation.participant.id,
    };

    // Send via socket for real-time
    if (socket) {
      socket.emit("message:send", messageData);
    }

    // Save to database
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatRoomId: selectedConversation.id,
          content: newMessage.trim(),
          messageType: 'text',
        }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }

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
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={fetchConversations}>
                    <IconRefresh className="h-4 w-4" />
                  </Button>
                  <Badge variant="secondary">{conversations.length}</Badge>
                </div>
              </div>
              <div className="relative mt-2">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar conversas..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {isLoadingConversations ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
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
                          <Avatar>
                            <AvatarFallback>
                              {conv.participant?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{conv.participant?.name || "Usuário"}</p>
                              {conv.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(conv.lastMessage.createdAt).toLocaleDateString("pt-PT", {
                                    day: "2-digit",
                                    month: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.lastMessage?.content || "Sem mensagens"}
                              </p>
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
                    
                    {conversations.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        <IconChat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma conversa ainda</p>
                      </div>
                    )}
                  </div>
                )}
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
                          {selectedConversation.participant?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedConversation.participant?.name || "Usuário"}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.participant?.title || selectedConversation.participant?.role}
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
                  {isLoadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-3/4" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.senderId === session?.user?.id;
                        
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
                  )}
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
