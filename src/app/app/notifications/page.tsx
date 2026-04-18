"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import {
  BloomSectionHeader,
  BloomCard,
  BloomEmpty,
} from "@/components/bloom-custom";
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
    } else if (
      notification.referenceType === "chat" &&
      notification.referenceId
    ) {
      router.push("/app/chat");
    }
  };

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Page Heading */}
        <div className="flex items-center gap-3 justify-between">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground tracking-tighter leading-none uppercase">
              Notificações
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {unreadCount > 0
                ? `${unreadCount} nova${unreadCount !== 1 ? "s" : ""}`
                : "Você receberá notificações sobre contratos e propostas"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" onClick={markAllAsRead} className="h-10 text-xs">
              <IconCheck className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl sm:rounded-3xl" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <BloomEmpty
            icon={<IconBell className="h-8 w-8" />}
            title="Nenhuma notificação"
            description="Você receberá notificações sobre contratos e propostas aqui"
          />
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || IconBell;
              const isUnread = !notification.isRead;

              // Determine notification type color scheme
              const getColorScheme = (type: string) => {
                if (
                  type.includes("approved") ||
                  type.includes("received") ||
                  type.includes("accepted") ||
                  type.includes("completed")
                ) {
                  return { bg: "bg-success/10", icon: "text-success" };
                }
                if (type.includes("rejected")) {
                  return { bg: "bg-destructive/10", icon: "text-destructive" };
                }
                return { bg: "bg-primary/10", icon: "text-primary" };
              };

              const colorScheme = getColorScheme(notification.type);

              return (
                <BloomCard
                  key={notification.id}
                  variant={isUnread ? "interactive" : "default"}
                  className="cursor-pointer group flex items-start gap-3 sm:gap-4 p-4 sm:p-5 md:p-7 rounded-2xl sm:rounded-3xl border border-border"
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon Container */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorScheme.bg} group-hover:scale-105 transition-transform duration-500`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorScheme.icon}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-1.5">
                      <p
                        className={`font-display font-black text-foreground text-sm uppercase tracking-tight ${isUnread ? "opacity-100" : "opacity-75"}`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <span className="text-[10px] font-display font-black text-muted-foreground/50 uppercase tracking-widest inline-block">
                        {new Date(notification.createdAt).toLocaleDateString(
                          "pt-PT",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {isUnread && (
                    <div className="h-3 w-3 bg-primary rounded-full shrink-0 mt-1 flex-shrink-0 animate-pulse" />
                  )}
                </BloomCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
