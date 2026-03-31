"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconBell,
  IconCheck,
  IconContract,
  IconMessageSquare,
  IconWallet,
  IconAlertCircle,
  IconLoader2,
  IconSettings,
  IconX,
} from "@/components/icons";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

// Notification type icons
const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  contract: IconContract,
  contract_accepted: IconCheck,
  contract_rejected: IconX,
  interview: IconMessageSquare,
  payment: IconWallet,
  message: IconMessageSquare,
  system: IconAlertCircle,
  proposal: IconContract,
  push_subscription: IconSettings,
};

function getNotificationUrl(notification: Notification): string {
  switch (notification.referenceType) {
    case 'contract':
      return `/app/contracts/${notification.referenceId}`;
    case 'interview':
      return `/app/interview/${notification.referenceId}`;
    case 'payment':
      return '/app/payments';
    case 'proposal':
      return '/app/proposals';
    default:
      return '/app/dashboard';
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isPushSupported,
    subscribeToPush,
    isPushEnabled,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  // Mark notification as read when clicked
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead([notification.id]);
    }
  };

  // Enable push notifications
  const handleEnablePush = async () => {
    await subscribeToPush();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
        >
          <IconBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-auto py-1 px-2"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Push notification prompt */}
        {isPushSupported && !isPushEnabled && (
          <div className="p-3 bg-primary/5 border-b">
            <div className="flex items-start gap-2">
              <IconBell className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Ativar notificações push</p>
                <p className="text-xs text-muted-foreground">
                  Receba alertas em tempo real
                </p>
              </div>
              <Button size="sm" onClick={handleEnablePush}>
                Ativar
              </Button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <IconBell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => {
                const Icon = notificationIcons[notification.type] || IconBell;
                const notificationUrl = getNotificationUrl(notification);

                return (
                  <Link
                    key={notification.id}
                    href={notificationUrl}
                    onClick={() => {
                      handleNotificationClick(notification);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors",
                      !notification.isRead && "bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-full shrink-0",
                      notification.isRead ? "bg-muted" : "bg-primary/10"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        notification.isRead ? "text-muted-foreground" : "text-primary"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        !notification.isRead && "text-foreground"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Link
              href="/app/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-primary hover:underline py-1"
            >
              Ver todas as notificações
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
