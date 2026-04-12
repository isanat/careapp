"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
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
  IconSearch,
  IconRefresh,
  IconArrowLeft
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  messageType?: "text" | "image" | "file" | "system";
  isEdited?: boolean;
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
  const { t } = useI18n();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await apiFetch('/api/chat/rooms');
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

  const fetchMessages = useCallback(async (chatRoomId: string, isInitial = false) => {
    // Only show loading state on initial load, not during polling
    if (isInitial) {
      setIsLoadingMessages(true);
    }
    try {
      const response = await apiFetch(`/api/chat/messages?chatRoomId=${chatRoomId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        if (isInitial) {
          setIsInitialLoad(false);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (isInitial) {
        setIsLoadingMessages(false);
      }
    }
  }, []);


  // Set up polling for messages (HTTP polling - works on Vercel)
  useEffect(() => {
    if (!selectedConversation) return;

    // Fetch immediately with loading state
    fetchMessages(selectedConversation.id, true);

    // Poll every 3 seconds (without loading state to prevent flickering)
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(selectedConversation.id, false);
    }, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    if (status === "authenticated") fetchConversations();
  }, [status, fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || !session?.user) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      await apiFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatRoomId: selectedConversation.id,
          content: messageContent,
          messageType: 'text'
        }),
      });

      // Fetch messages immediately to show the new message
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error saving message:', error);
    }

    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-8rem)]">
        <div className="grid h-full lg:grid-cols-[320px_1fr] gap-3">
          {/* Conversations List */}
          <div className={`bg-surface rounded-2xl shadow-card border border-border/50 flex flex-col ${mobileShowChat ? "hidden" : "flex"} lg:flex`}>
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">{t.chat.title}</h2>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="icon" onClick={fetchConversations} className="h-8 w-8 rounded-lg">
                    <IconRefresh className="h-4 w-4" />
                  </Button>
                  <Badge variant="secondary" className="rounded-lg">{conversations.length}</Badge>
                </div>
              </div>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search.placeholder}
                  className="pl-10 h-9 rounded-xl bg-muted border-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {isLoadingConversations ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-16 w-full rounded-xl" />))}
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {conversations
                    .filter((conv) => !searchQuery || conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => { setSelectedConversation(conv); setMobileShowChat(true); }}
                        className={`w-full text-left transition-all rounded-xl p-3 border-2 ${
                          selectedConversation?.id === conv.id
                            ? "bg-primary/5 border-primary/40 hover:border-primary/60"
                            : "border-border/30 hover:border-border/60 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-lg flex-shrink-0">
                            <AvatarFallback className="rounded-lg text-sm font-semibold bg-primary/10 text-primary">
                              {conv.participant?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className={`text-sm font-semibold truncate ${
                                selectedConversation?.id === conv.id ? "text-primary" : "text-foreground"
                              }`}>
                                {conv.participant?.name || "Usuario"}
                              </p>
                              {conv.lastMessage && (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                  {new Date(conv.lastMessage.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs truncate ${
                                conv.unreadCount > 0
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground"
                              }`}>
                                {conv.lastMessage?.content || t.chat.noMessages}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold bg-primary text-white rounded-full shrink-0">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}

                  {conversations.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground">
                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                        <IconChat className="h-6 w-6" />
                      </div>
                      <p className="text-sm">{t.chat.noChats}</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`bg-surface rounded-2xl shadow-card border border-border/50 flex flex-col ${!mobileShowChat ? "hidden lg:flex" : "flex"}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b border-border/50 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-8 w-8 rounded-lg"
                    onClick={() => setMobileShowChat(false)}
                  >
                    <IconArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9 rounded-xl">
                    <AvatarFallback className="rounded-xl text-xs font-semibold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                      {selectedConversation.participant?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{selectedConversation.participant?.name || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.participant?.title || selectedConversation.participant?.role}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages && isInitialLoad ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-10 w-3/4 rounded-xl" />))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const isOwn = message.senderId === session?.user?.id;
                        return (
                          <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                              isOwn
                                ? "bg-primary text-white rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}>
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <p className={`text-[10px] mt-1 ${isOwn ? "text-white/60" : "text-muted-foreground"}`}>
                                {new Date(message.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {typingUser && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                            <p className="text-sm text-muted-foreground">{typingUser}...</p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t.chat.placeholder}
                      className="flex-1 h-11 rounded-xl bg-muted border-0"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim()}
                      size="icon"
                      className="h-11 w-11 rounded-xl shrink-0"
                    >
                      <IconSend className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <IconChat className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">{t.chat.new}</h3>
                  <p className="text-sm text-muted-foreground">{t.chat.noChats}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
