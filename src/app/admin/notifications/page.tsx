"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/common/page-header";
import { BloomCard } from "@/components/bloom-custom/BloomCard";
import { BloomBadge } from "@/components/bloom-custom/BloomBadge";
import { BloomSectionHeader } from "@/components/bloom-custom/BloomSectionHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconBell,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
  IconInfo,
  IconAlertCircle,
} from "@/components/icons";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  severity: string;
  isRead: boolean;
  readAt: string | null;
  readBy: string | null;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/admin/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const response = await apiFetch(`/api/admin/notifications/${id}/read`, {
        method: "POST",
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao marcar como lida",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      await Promise.all(unreadIds.map(id => markAsRead(id)));
      toast({ title: "Sucesso", description: "Todas notificações marcadas como lidas" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao marcar todas como lidas",
        variant: "destructive",
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <IconAlertCircle className="h-5 w-5 text-destructive" />;
      case "WARNING":
        return <IconAlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <IconInfo className="h-5 w-5 text-primary" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "border-l-destructive bg-destructive/10";
      case "WARNING":
        return "border-l-warning bg-warning/10";
      default:
        return "border-l-primary bg-primary/10";
    }
  };

  const filteredNotifications = filter === "unread"
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <PageHeader
        title="Notificações"
        description="Alertas e notificações do sistema"
        actions={
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <IconCheck className="h-4 w-4 mr-2" />
                Marcar Todas como Lidas
              </Button>
            )}
            <Button variant="outline" onClick={fetchNotifications}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        <BloomCard variant="gradient">
          <div className="flex items-center gap-4 p-5 sm:p-6 md:p-7">
            <div className="p-3 bg-primary/20 rounded-full">
              <IconBell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notifications.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </BloomCard>
        <BloomCard variant="warning">
          <div className="flex items-center gap-4 p-5 sm:p-6 md:p-7">
            <div className="p-3 bg-warning/20 rounded-full">
              <IconAlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-sm text-muted-foreground">Não Lidas</p>
            </div>
          </div>
        </BloomCard>
        <BloomCard>
          <div className="flex items-center gap-4 p-5 sm:p-6 md:p-7">
            <div className="p-3 bg-destructive/20 rounded-full">
              <IconAlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {notifications.filter(n => n.severity === "CRITICAL").length}
              </p>
              <p className="text-sm text-muted-foreground">Críticas</p>
            </div>
          </div>
        </BloomCard>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">
              Todas
              <BloomBadge variant="secondary" className="ml-2">
                {notifications.length}
              </BloomBadge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Não Lidas
              {unreadCount > 0 && (
                <BloomBadge className="ml-2 bg-warning">{unreadCount}</BloomBadge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Notifications List */}
      <motion.div variants={itemVariants} className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : filteredNotifications.length === 0 ? (
          <BloomCard>
            <div className="py-12 text-center text-slate-500 p-5 sm:p-6 md:p-7">
              <IconBell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          </BloomCard>
        ) : (
          filteredNotifications.map((notification) => (
            <BloomCard
              key={notification.id}
              className={`border-l-4 ${getSeverityColor(notification.severity)} ${
                notification.isRead ? "opacity-60" : ""
              }`}
            >
              <div className="p-5 sm:p-6 md:p-7">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getSeverityIcon(notification.severity)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{notification.title}</h3>
                      {notification.isRead && (
                        <BloomBadge variant="outline" className="text-xs">
                          Lida
                        </BloomBadge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(notification.createdAt), "dd 'de' MMMM, HH:mm", {
                        locale: pt,
                      })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <IconCheck className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </BloomCard>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
