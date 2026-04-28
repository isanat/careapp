"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { NotificacoesView } from "@isanat/bloom-elements";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

interface Notification {
  id: number;
  type: string;
  title: string;
  msg: string;
  read: boolean;
  date: string;
}

function NotificationsPageContent() {
  const { status } = useSession();
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") fetchNotifications();
  }, [status]);

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch("/api/notifications?limit=50");
      if (response.ok) {
        const data = await response.json();
        const notifs = (data.notifications || []).map((n: any) => ({
          id: parseInt(n.id),
          type: n.type,
          title: n.title,
          msg: n.message,
          read: n.isRead,
          date: n.createdAt,
        }));
        setNotifications(notifs);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId?: number) => {
    try {
      if (notificationId) {
        await apiFetch(`/api/notifications/${notificationId}`, {
          method: "PATCH",
          body: JSON.stringify({ isRead: true }),
        });
      } else {
        await apiFetch("/api/notifications", {
          method: "PATCH",
          body: JSON.stringify({ markAllAsRead: true }),
        });
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <p>{t.loading}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning>
      <NotificacoesView
        notifications={notifications.length > 0 ? notifications : undefined}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
}

export default function NotificationsPage() {
  return <AppShell><NotificationsPageContent /></AppShell>;
}
