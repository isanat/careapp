"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/common/page-header";
import { StatsCard } from "@/components/admin/common/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconShield,
  IconRefresh,
  IconCheck,
  IconX,
  IconEye,
  IconTrash,
  IconStar,
  IconMessageSquare,
  IconUser,
  IconFlag,
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ModerationItem {
  id: string;
  type: "review" | "chat" | "profile" | "report";
  status: string;
  reportedBy: string | null;
  reason: string;
  content: string;
  createdAt: string;
  // For reviews
  reviewRating?: number;
  reviewComment?: string;
  reviewFrom?: string;
  reviewTo?: string;
  // For reports
  reportDetails?: string;
}

export default function AdminModerationPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/moderation?type=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching moderation items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const handleAction = async (id: string, action: "approve" | "reject" | "delete") => {
    try {
      const response = await fetch(`/api/admin/moderation/${id}/${action}`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Item ${action === "approve" ? "aprovado" : action === "reject" ? "rejeitado" : "excluído"}`,
        });
        fetchItems();
      } else {
        const data = await response.json();
        toast({
          title: "Erro",
          description: data.error || "Falha ao processar",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar ação",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "review":
        return <IconStar className="h-4 w-4" />;
      case "chat":
        return <IconMessageSquare className="h-4 w-4" />;
      case "profile":
        return <IconUser className="h-4 w-4" />;
      case "report":
        return <IconFlag className="h-4 w-4" />;
      default:
        return <IconShield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderação"
        description="Modere conteúdo e resolva denúncias"
        actions={
          <Button variant="outline" onClick={fetchItems}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Pendentes"
          value={stats.pending}
          icon={<IconShield className="h-5 w-5" />}
          variant="warning"
          loading={loading}
        />
        <StatsCard
          title="Aprovados Hoje"
          value={stats.approved}
          icon={<IconCheck className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Rejeitados Hoje"
          value={stats.rejected}
          icon={<IconX className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Todos
          </TabsTrigger>
          <TabsTrigger value="review">
            <IconStar className="h-4 w-4 mr-2" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="chat">
            <IconMessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="report">
            <IconFlag className="h-4 w-4 mr-2" />
            Denúncias
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                <IconShield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum item para moderar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{item.type}</Badge>
                          <Badge
                            className={
                              item.status === "PENDING"
                                ? "bg-amber-500"
                                : item.status === "APPROVED"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }
                          >
                            {item.status}
                          </Badge>
                        </div>

                        <p className="text-sm font-medium mb-1">{item.reason}</p>
                        <p className="text-sm text-slate-600 mb-3">{item.content}</p>

                        {item.type === "review" && item.reviewRating && (
                          <div className="flex items-center gap-2 mb-2 text-sm">
                            <span className="flex items-center gap-1">
                              <IconStar className="h-4 w-4 text-amber-500" />
                              {item.reviewRating}/5
                            </span>
                            <span className="text-slate-400">
                              De: {item.reviewFrom} → Para: {item.reviewTo}
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-slate-400">
                          {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                          {item.reportedBy && ` • Reportado por: ${item.reportedBy}`}
                        </p>
                      </div>

                      {item.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAction(item.id, "approve")}
                          >
                            <IconCheck className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(item.id, "reject")}
                          >
                            <IconX className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
