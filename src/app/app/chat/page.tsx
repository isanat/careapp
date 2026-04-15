"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { BloomCard, BloomBadge, BloomEmpty, BloomSectionHeader } from "@/components/bloom-custom";
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

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-7rem)]">
        <div className="grid h-full md:grid-cols-[380px_1fr] gap-0">
          {/* Conversations List */}
          <div className={`bg-card border border-border rounded-l-3xl rounded-r-none flex flex-col ${mobileShowChat ? "hidden" : "flex"} md:flex`}>
            {/* Header with Search */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={headerVariants}
              className="p-5 sm:p-6 md:p-7 border-b border-border space-y-4"
            >
              <div className="flex items-center justify-between">
                <BloomSectionHeader
                  title={t.chat.title}
                  className="mb-0"
                />
                <BloomBadge variant="default" className="shrink-0 min-w-6 h-6 flex items-center justify-center rounded-full text-xs font-black">
                  {conversations.filter((c) => c.unreadCount > 0).length}
                </BloomBadge>
              </div>
              <div className="relative">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search.placeholder}
                  className="pl-11 bg-secondary border-border rounded-2xl h-11 text-sm placeholder:text-muted-foreground/70"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
              {isLoadingConversations ? (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="p-5 sm:p-6 md:p-7 space-y-4"
                >
                  {[1, 2, 3].map((i) => (
                    <motion.div key={i} variants={itemVariants}>
                      <Skeleton className="h-16 bg-secondary rounded-2xl" />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="p-5 sm:p-6 md:p-7 space-y-3"
                >
                  <AnimatePresence mode="popLayout">
                    {conversations
                      .filter((conv) => !searchQuery || conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((conv, idx) => (
                        <motion.div
                          key={conv.id}
                          variants={itemVariants}
                          layout
                          exit={{ opacity: 0, y: -8 }}
                        >
                          <button
                            onClick={() => {
                              setSelectedConversation(conv);
                              setMobileShowChat(true);
                            }}
                            className="w-full text-left"
                          >
                            <BloomCard
                              variant={selectedConversation?.id === conv.id ? "interactive" : "default"}
                              className={`p-4 transition-all duration-300 ${
                                selectedConversation?.id === conv.id
                                  ? "bg-primary/10 border-primary/30"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-2xl bg-secondary/40 border border-border/50 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-display font-black text-foreground/90">
                                    {conv.participant?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                                  </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="font-display font-black text-base text-foreground truncate">
                                      {conv.participant?.name || "Usuario"}
                                    </p>
                                    {conv.lastMessage && (
                                      <span className="text-xs text-muted-foreground/60 whitespace-nowrap shrink-0">
                                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-body text-muted-foreground line-clamp-1">
                                      {conv.lastMessage?.content || t.chat.noMessages}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                      <BloomBadge variant="default" className="shrink-0 min-w-5 h-5 flex items-center justify-center rounded-full text-xs font-black">
                                        {conv.unreadCount}
                                      </BloomBadge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </BloomCard>
                          </button>
                        </motion.div>
                      ))}
                  </AnimatePresence>

                  {conversations.length === 0 && (
                    <motion.div variants={itemVariants}>
                      <BloomEmpty
                        icon={<IconChat className="h-8 w-8" />}
                        title={t.chat.noChats}
                        description={t.chat.noMessages}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`bg-card border border-border border-l-0 rounded-r-3xl rounded-l-none flex flex-col ${!mobileShowChat ? "hidden md:flex" : "flex"}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={headerVariants}
                  className="p-5 sm:p-6 md:p-7 border-b border-border flex items-center justify-between gap-4"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8 rounded-lg"
                    onClick={() => setMobileShowChat(false)}
                  >
                    <IconArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="w-12 h-12 rounded-2xl bg-secondary/40 border border-border/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-display font-black text-foreground">
                      {selectedConversation.participant?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-lg text-foreground truncate">
                      {selectedConversation.participant?.name || "Usuario"}
                    </p>
                    <BloomBadge variant="success" className="inline-block text-xs mt-1">
                      Online
                    </BloomBadge>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="rounded-xl">
                    <IconPhone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="rounded-xl">
                    <IconMoreVertical className="h-4 w-4" />
                  </Button>
                </motion.div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-5 sm:px-6 md:px-7 py-5 sm:py-6 md:py-7">
                  {isLoadingMessages && isInitialLoad ? (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      className="space-y-4"
                    >
                      {[1, 2, 3].map((i) => (
                        <motion.div key={i} variants={itemVariants}>
                          <Skeleton className="h-12 w-3/4 bg-secondary rounded-2xl" />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      className="space-y-4"
                    >
                      <AnimatePresence>
                        {messages.map((message) => {
                          const isOwn = message.senderId === session?.user?.id;
                          return (
                            <motion.div
                              key={message.id}
                              variants={itemVariants}
                              layout
                              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                            >
                              <div className="max-w-[72%]">
                                {!isOwn && (
                                  <p className="text-xs text-muted-foreground/70 mb-2 font-display font-black uppercase tracking-tight">
                                    {message.senderName}
                                  </p>
                                )}
                                <div
                                  className={`rounded-2xl px-5 py-3.5 text-base font-body leading-relaxed border transition-all duration-300 ${
                                    isOwn
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-secondary/40 text-foreground border-border/80"
                                  }`}
                                >
                                  <p>{message.content}</p>
                                </div>
                                <p className={`text-xs text-muted-foreground/60 mt-2 ${isOwn ? "text-right" : "text-left"}`}>
                                  {new Date(message.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}

                        {typingUser && (
                          <motion.div
                            variants={itemVariants}
                            layout
                            className="flex justify-start"
                          >
                            <div className="max-w-xs">
                              <p className="text-xs text-muted-foreground mb-2 font-display font-black uppercase tracking-tight">
                                {typingUser}
                              </p>
                              <BloomCard className="p-3 bg-secondary/40">
                                <p className="text-sm font-body text-muted-foreground">Typing...</p>
                              </BloomCard>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </motion.div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={headerVariants}
                  className="p-5 sm:p-6 md:p-7 border-t border-border"
                >
                  <BloomCard className="p-2 bg-secondary/40 flex gap-2 items-center">
                    <button className="h-8 w-8 rounded-xl hover:bg-muted/40 flex items-center justify-center text-muted-foreground transition-colors duration-200">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t.chat.placeholder}
                      className="flex-1 bg-transparent outline-none text-base font-body px-2 py-2 text-foreground placeholder:text-muted-foreground border-0 focus-visible:ring-0"
                    />
                    <button className="h-8 w-8 rounded-xl hover:bg-muted/40 flex items-center justify-center text-muted-foreground transition-colors duration-200">
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
                  </BloomCard>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={headerVariants}
                className="flex-1 flex items-center justify-center"
              >
                <BloomEmpty
                  icon={<IconChat className="h-8 w-8" />}
                  title={t.chat.new}
                  description={t.chat.noChats}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
