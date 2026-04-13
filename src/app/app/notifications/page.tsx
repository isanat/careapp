"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
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
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-foreground uppercase mb-2">
              Notificações
            </h1>
            {unreadCount > 0 && (
              <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
                {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button size="sm" onClick={markAllAsRead} className="h-10 text-xs">
              <IconCheck className="h-4 w-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-3xl" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="text-center py-12 max-w-sm mx-auto">
            <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-5">
              <IconBell size={28} className="text-muted-foreground" />
            </div>
            <h4 className="font-display font-bold text-foreground text-lg mb-2">Nenhuma notificação</h4>
            <p className="text-sm text-muted-foreground">Você receberá notificações sobre contratos e propostas aqui</p>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || IconBell;
              const isUnread = !notification.isRead;

              // Determine notification type color scheme
              const getColorScheme = (type: string) => {
                if (type.includes("approved") || type.includes("received") || type.includes("accepted") || type.includes("completed")) {
                  return { bg: "bg-success/5", border: "border-success/20", icon: "text-success" };
                }
                if (type.includes("rejected")) {
                  return { bg: "bg-destructive/5", border: "border-destructive/20", icon: "text-destructive" };
                }
                return { bg: "bg-primary/5", border: "border-primary/20", icon: "text-primary" };
              };

              const colorScheme = getColorScheme(notification.type);

              return (
                <div
                  key={notification.id}
                  className={`bg-card rounded-3xl p-5 sm:p-7 border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300 cursor-pointer group ${
                    isUnread ? colorScheme.border : "border-border"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon Container */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorScheme.bg}`}>
                      <Icon className={`w-6 h-6 ${colorScheme.icon}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1">
                        <p className={`font-display font-bold text-foreground text-sm ${isUnread ? "opacity-100" : "opacity-75"}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest inline-block">
                          {new Date(notification.createdAt).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {isUnread && (
                      <div className="h-2.5 w-2.5 bg-primary rounded-full shrink-0 mt-1.5 flex-shrink-0" />
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
