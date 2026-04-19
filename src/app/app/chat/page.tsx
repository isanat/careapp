"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import {
  BloomCard,
  BloomBadge,
  BloomEmpty,
  BloomSectionHeader,
} from "@/components/bloom-custom";
import {
  IconChat,
  IconSend,
  IconSearch,
  IconArrowLeft,
  IconPhone,
  IconMoreVertical,
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

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
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
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const fetchConversations = useCallback(async () => {
    try {
      const response = await apiFetch("/api/chat/rooms");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.chatRooms || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const fetchMessages = useCallback(
    async (chatRoomId: string, isInitial = false) => {
      if (isInitial) {
        setIsLoadingMessages(true);
      }
      try {
        const response = await apiFetch(
          `/api/chat/messages?chatRoomId=${chatRoomId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          if (isInitial) {
            setIsInitialLoad(false);
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        if (isInitial) {
          setIsLoadingMessages(false);
        }
      }
    },
    [],
  );

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
      await apiFetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId: selectedConversation.id,
          content: messageContent,
          messageType: "text",
        }),
      });

      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error("Error saving message:", error);
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
      <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)]">
        <div className="flex h-full border border-border rounded-3xl overflow-hidden bg-card shadow-card">
          {/* Conversations List */}
          <div
            className={`flex md:flex w-full md:w-80 border-r border-border flex-col bg-secondary/20 ${mobileShowChat ? "hidden" : "flex"} md:flex`}
          >
            <div className="p-4 sm:p-5 border-b border-border flex justify-between items-center">
              <span className="font-display font-black text-lg tracking-tight uppercase text-foreground">
                {t.chat.title}
              </span>
              <span className="text-xs font-display font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                {conversations.filter((c) => c.unreadCount > 0).length}
              </span>
            </div>

            {/* Search Bar */}
            <div className="p-3 sm:p-4 border-b border-border">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search.placeholder}
                  className="pl-10 bg-secondary border border-border rounded-2xl h-10 text-sm placeholder:text-muted-foreground/70"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="space-y-0">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-16 bg-secondary rounded-none border-b border-border/30"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {conversations
                    .filter(
                      (conv) =>
                        !searchQuery ||
                        conv.participant?.name
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    )
                    .map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setMobileShowChat(true);
                        }}
                        className={`w-full p-3 sm:p-4 flex gap-3 border-b border-border/30 cursor-pointer transition-all text-left ${
                          selectedConversation?.id === conv.id
                            ? "bg-secondary/30"
                            : "hover:bg-secondary/20"
                        }`}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-secondary overflow-hidden shrink-0 shadow-sm border-2 border-border flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-display font-black text-foreground">
                            {conv.participant?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "?"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-display font-bold text-sm text-foreground truncate">
                              {conv.participant?.name || "Usuario"}
                            </span>
                            {conv.lastMessage && (
                              <span className="text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap shrink-0">
                                {new Date(
                                  conv.lastMessage.createdAt,
                                ).toLocaleTimeString("pt-PT", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                              {conv.lastMessage?.content ||
                                t.chat.noMessages}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="ml-2 px-1.5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">
                                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}

                  {conversations.length === 0 && (
                    <div className="p-8 flex items-center justify-center">
                      <BloomEmpty
                        icon={<IconChat className="h-8 w-8" />}
                        title={t.chat.noChats}
                        description={t.chat.noMessages}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`hidden md:flex flex-1 flex-col bg-secondary/10 ${!mobileShowChat ? "hidden md:flex" : "flex"}`}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 sm:p-5 bg-card border-b border-border flex justify-between items-center shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden h-8 w-8 rounded-lg"
                      onClick={() => setMobileShowChat(false)}
                    >
                      <IconArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-secondary overflow-hidden border-2 border-card flex items-center justify-center shrink-0">
                      <span className="text-xs sm:text-sm font-display font-black text-foreground">
                        {selectedConversation.participant?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-foreground">
                      {selectedConversation.participant?.name || "Usuario"}
                    </div>
                  </div>
                  <div className="text-[10px] font-display font-bold text-success uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                    ONLINE
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 sm:px-5 py-4 sm:py-5">
                  {isLoadingMessages && isInitialLoad ? (
                    <div className="space-y-3 sm:space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton
                          key={i}
                          className="h-12 w-3/4 bg-secondary rounded-3xl"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-5">
                      {messages.map((message) => {
                        const isOwn = message.senderId === session?.user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? "flex-col items-end" : "flex-col items-start"}`}
                          >
                            <div className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-tr-lg"
                                : "bg-card text-foreground rounded-tl-lg border border-border"
                            }`}>
                              {message.content}
                            </div>
                            <span className="text-[10px] font-display font-bold text-muted-foreground/50 uppercase mt-1.5 mx-1 tracking-widest">
                              {new Date(message.createdAt).toLocaleTimeString(
                                "pt-PT",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                        );
                      })}

                      {typingUser && (
                        <div className="flex flex-col items-start">
                          <div className="max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm bg-card text-foreground rounded-tl-lg border border-border">
                            <p className="text-muted-foreground">
                              Typing...
                            </p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 sm:p-5 bg-card border-t border-border">
                  <div className="flex items-center gap-2 sm:gap-3 bg-secondary border-2 border-border rounded-3xl px-3 sm:px-5 py-2 sm:py-3 focus-within:border-primary focus-within:bg-card transition-all">
                    <button className="h-8 w-8 rounded-xl hover:bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t.chat.placeholder}
                      className="flex-1 bg-transparent outline-none text-sm px-0 py-0 text-foreground placeholder:text-muted-foreground border-0 focus-visible:ring-0"
                    />
                    <button className="h-8 w-8 rounded-xl hover:bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0">
                      <Smile className="h-4 w-4" />
                    </button>
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim()}
                      className="bg-primary text-primary-foreground p-2 sm:p-2.5 rounded-xl shadow-md hover:shadow-glow hover:scale-105 active:scale-95 transition-all shrink-0 h-auto w-auto"
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
