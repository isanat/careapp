"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { BloomCard, BloomBadge, BloomEmpty } from "@/components/bloom";
import {
  IconChat,
  IconSend,
  IconSearch,
  IconArrowLeft,
  IconPhone,
  IconMoreVertical
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { Paperclip, Smile } from "lucide-react";

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

  useEffect(() => {
    if (!selectedConversation) return;

    fetchMessages(selectedConversation.id, true);

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

      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error saving message:', error);
    }

    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-7rem)]">
        <div className="grid h-full lg:grid-cols-[380px_1fr] gap-0">
          {/* Conversations List */}
          <div className={`bg-card border border-border/70 rounded-l-3xl rounded-r-none flex flex-col ${mobileShowChat ? "hidden" : "flex"} lg:flex`}>
            <div className="p-5 border-b border-border/70">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tight">{t.chat.title}</h2>
                <div className="h-6 min-w-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {conversations.filter((c) => c.unreadCount > 0).length}
                </div>
              </div>
              <div className="relative">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search.placeholder}
                  className="pl-11 bg-background border-border/70 rounded-2xl h-11 text-sm placeholder:text-muted-foreground/70"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {isLoadingConversations ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-16 bg-secondary rounded-2xl" />))}
                </div>
              ) : (
                <div className="p-0">
                  {conversations
                    .filter((conv) => !searchQuery || conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setMobileShowChat(true);
                        }}
                        className="w-full"
                      >
                        <div
                          className={`px-5 py-4 border-b border-border/40 transition-colors text-left ${
                            selectedConversation?.id === conv.id ? "bg-primary/10" : "hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-secondary/40 border border-border/50 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-display font-bold text-foreground/90">
                                {conv.participant?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <p className="font-display font-bold text-[1rem] text-foreground truncate">
                                  {conv.participant?.name || "Usuario"}
                                </p>
                                {conv.lastMessage && (
                                  <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap shrink-0">
                                    {new Date(conv.lastMessage.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">
                                  {conv.lastMessage?.content || t.chat.noMessages}
                                </p>
                                {conv.unreadCount > 0 && (
                                  <BloomBadge variant="primary" className="shrink-0 min-w-5 h-5 flex items-center justify-center rounded-full text-[11px]">
                                    {conv.unreadCount}
                                  </BloomBadge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}

                  {conversations.length === 0 && (
                    <BloomEmpty
                      icon={<IconChat className="h-8 w-8" />}
                      title={t.chat.noChats}
                      description={t.chat.noMessages}
                    />
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`bg-card border border-border/70 border-l-0 rounded-r-3xl rounded-l-none flex flex-col ${!mobileShowChat ? "hidden lg:flex" : "flex"}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-5 border-b border-border/70 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-8 w-8 rounded-lg"
                    onClick={() => setMobileShowChat(false)}
                  >
                    <IconArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="w-12 h-12 rounded-2xl bg-secondary/40 border border-border/50 flex items-center justify-center">
                    <span className="text-sm font-display font-bold text-foreground">
                      {selectedConversation.participant?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-lg text-foreground truncate">{selectedConversation.participant?.name || "Usuario"}</p>
                    <p className="text-[11px] tracking-[0.25em] text-success uppercase">Online</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="rounded-xl"><IconPhone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" className="rounded-xl"><IconMoreVertical className="h-4 w-4" /></Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-6 py-5">
                  {isLoadingMessages && isInitialLoad ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-12 w-3/4 bg-secondary rounded-2xl" />))}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {messages.map((message) => {
                        const isOwn = message.senderId === session?.user?.id;
                        return (
                          <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[72%]">
                              {!isOwn && (
                                <p className="text-[10px] text-muted-foreground/70 mb-1 font-medium">{message.senderName}</p>
                              )}
                              <div className={`rounded-[2rem] px-5 py-3.5 text-[1rem] leading-relaxed border ${
                                isOwn
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-transparent text-foreground border-border/80"
                              }`}>
                                <p>{message.content}</p>
                              </div>
                              <p className={`text-[10px] text-muted-foreground/60 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                                {new Date(message.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {typingUser && (
                        <div className="flex justify-start">
                          <div className="max-w-xs">
                            <p className="text-[9px] text-muted-foreground mb-1 font-medium">{typingUser}</p>
                            <div className="bg-secondary rounded-3xl px-4 py-3">
                              <p className="text-sm text-muted-foreground">Typing...</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-5 border-t border-border/70">
                  <div className="flex gap-2 items-center bg-secondary/30 rounded-3xl border border-border/70 pl-3 pr-2 py-2">
                    <button className="h-8 w-8 rounded-xl hover:bg-muted/40 flex items-center justify-center text-muted-foreground">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t.chat.placeholder}
                      className="flex-1 bg-transparent outline-none text-sm px-2 py-2 text-foreground placeholder:text-muted-foreground border-0 focus-visible:ring-0"
                    />
                    <button className="h-8 w-8 rounded-xl hover:bg-muted/40 flex items-center justify-center text-muted-foreground">
                      <Smile className="h-4 w-4" />
                    </button>
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim()}
                      size="icon"
                      className="h-10 w-10 rounded-2xl shrink-0"
                    >
                      <IconSend className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <BloomEmpty
                  icon={<IconChat className="h-8 w-8" />}
                  title={t.chat.new}
                  description={t.chat.noChats}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
