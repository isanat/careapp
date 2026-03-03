"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
      const response = await fetch("/api/notifications?limit=50");
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
      const response = await fetch("/api/notifications", {
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
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{"Notificações"}</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <IconCheck className="h-4 w-4 mr-1" />
              {"Marcar todas como lidas"}
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="px-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="px-4 py-12 text-center">
            <IconBell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">{"Nenhuma notificação"}</p>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="px-4 space-y-2">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || IconBell;
              return (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.isRead ? "border-primary/30 bg-primary/5" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full shrink-0 ${!notification.isRead ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`h-4 w-4 ${!notification.isRead ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(notification.createdAt).toLocaleDateString("pt-PT", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-primary rounded-full shrink-0 mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
