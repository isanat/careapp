"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import {
  IconBell,
  IconCheck,
  IconContract,
  IconChat,
  IconEuro,
  IconShield,
  IconStar,
  IconAlertCircle,
} from "@/components/icons";
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  contract_created: IconContract,
  contract_accepted: IconCheck,
  contract_rejected: IconAlertCircle,
  contract_completed: IconCheck,
  contract_payment: IconEuro,
  chat_message: IconChat,
  kyc_approved: IconShield,
  kyc_rejected: IconAlertCircle,
  review_received: IconStar,
  payment_received: IconEuro,
};

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === "authenticated") fetchNotifications();
  }, [status]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/notifications?limit=50");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiFetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.referenceType === "contract" && notification.referenceId) {
      router.push(`/app/contracts/${notification.referenceId}`);
    } else if (notification.referenceType === "chat" && notification.referenceId) {
      router.push("/app/chat");
    }
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">Notificações</h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary/10 text-primary border-0 px-2 py-1">
                {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllAsRead} className="h-8 text-xs">
              <IconCheck className="h-3.5 w-3.5 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="py-12 text-center bg-surface rounded-xl border-2 border-dashed border-border/30">
            <IconBell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">Nenhuma notificação</p>
            <p className="text-xs text-muted-foreground mt-1">Você receberá notificações sobre contratos e propostas aqui</p>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || IconBell;
              const isUnread = !notification.isRead;

              return (
                <div
                  key={notification.id}
                  className={`bg-surface rounded-xl p-4 border-2 cursor-pointer transition-all card-interactive ${
                    isUnread
                      ? "border-primary/30 hover:border-primary/50"
                      : "border-border/30 hover:border-border/50"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isUnread ? "bg-primary/10" : "bg-muted/30"
                    }`}>
                      <Icon className={`h-5 w-5 ${isUnread ? "text-primary" : "text-muted-foreground"}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`text-sm truncate ${isUnread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 ml-2">
                          {new Date(notification.createdAt).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className={`text-xs line-clamp-2 ${isUnread ? "text-foreground/80" : "text-muted-foreground"}`}>
                        {notification.message}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {isUnread && (
                      <div className="h-2.5 w-2.5 bg-primary rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
