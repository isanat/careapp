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
      <div className="h-[calc(100vh-8rem)]">
        <div className="grid h-full lg:grid-cols-[320px_1fr] gap-3">
          {/* Conversations List */}
          <div className={`bg-card rounded-2xl shadow-card border border-border flex flex-col ${mobileShowChat ? "hidden" : "flex"} lg:flex`}>
            <div className="p-4 border-b border-border">
              <h2 className="text-xl sm:text-2xl font-display font-black uppercase mb-4">{t.chat.title}</h2>
              <div className="relative">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search.placeholder}
                  className="pl-11 bg-secondary border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
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
                <div className="p-3 space-y-2">
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
                        <BloomCard
                          variant={selectedConversation?.id === conv.id ? "interactive" : "default"}
                          className={selectedConversation?.id === conv.id ? "bg-primary/10 border-primary/50" : ""}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-display font-bold text-foreground">
                                {conv.participant?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-display font-bold text-sm text-foreground truncate">
                                  {conv.participant?.name || "Usuario"}
                                </p>
                                {conv.lastMessage && (
                                  <span className="text-[9px] text-muted-foreground/50 whitespace-nowrap shrink-0">
                                    {new Date(conv.lastMessage.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                                  {conv.lastMessage?.content || t.chat.noMessages}
                                </p>
                                {conv.unreadCount > 0 && (
                                  <BloomBadge variant="primary" className="shrink-0">
                                    {conv.unreadCount}
                                  </BloomBadge>
                                )}
                              </div>
                            </div>
                          </div>
                        </BloomCard>
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
          <div className={`bg-card rounded-2xl shadow-card border border-border flex flex-col ${!mobileShowChat ? "hidden lg:flex" : "flex"}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-8 w-8 rounded-lg"
                    onClick={() => setMobileShowChat(false)}
                  >
                    <IconArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center">
                    <span className="text-sm font-display font-bold text-foreground">
                      {selectedConversation.participant?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-foreground">{selectedConversation.participant?.name || "Usuario"}</p>
                    <p className="text-[9px] text-muted-foreground/50">
                      {selectedConversation.participant?.title || selectedConversation.participant?.role}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages && isInitialLoad ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-12 w-3/4 bg-secondary rounded-2xl" />))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.senderId === session?.user?.id;
                        return (
                          <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-xs">
                              {!isOwn && (
                                <p className="text-[9px] text-muted-foreground mb-1 font-medium">{message.senderName}</p>
                              )}
                              <div className={`rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-foreground"
                              }`}>
                                <p>{message.content}</p>
                              </div>
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
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2 items-center bg-card rounded-3xl border border-border p-1.5">
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t.chat.placeholder}
                      className="flex-1 bg-transparent outline-none text-sm px-4 py-2 text-foreground placeholder:text-muted-foreground border-0"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim()}
                      size="icon"
                      className="h-9 w-9 rounded-2xl shrink-0"
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
