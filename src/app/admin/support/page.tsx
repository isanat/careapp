"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/admin/common/page-header";
import { StatsCard } from "@/components/admin/common/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  IconHeadphones,
  IconRefresh,
  IconSearch,
  IconClock,
  IconUser,
  IconMail,
  IconAlertTriangle,
  IconCheck,
  IconMessageSquare,
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  urgent: number;
}

export default function AdminSupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // Dialog states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);

      const response = await apiFetch(`/api/admin/support?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
        setStats(data.stats || { total: 0, open: 0, inProgress: 0, resolved: 0, urgent: 0 });
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const response = await apiFetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolution }),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Status atualizado" });
        setResolveDialogOpen(false);
        setDetailsOpen(false);
        setResolution("");
        fetchTickets();
      } else {
        toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }> = {
      open: { variant: "destructive", label: "Aberto" },
      in_progress: { variant: "secondary", label: "Em Progresso", className: "bg-primary/10 text-primary" },
      waiting_user: { variant: "outline", label: "Aguardando Usuário" },
      resolved: { variant: "default", label: "Resolvido", className: "bg-success/10 text-success" },
      closed: { variant: "outline", label: "Fechado" },
    };
    const c = config[status] || config.open;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string; label: string }> = {
      urgent: { className: "bg-destructive/10 text-destructive", label: "URGENTE" },
      high: { className: "bg-warning/10 text-warning", label: "Alta" },
      normal: { className: "bg-warning/10 text-warning", label: "Normal" },
      low: { className: "bg-muted text-muted-foreground", label: "Baixa" },
    };
    const c = config[priority] || config.normal;
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: "Geral",
      payment: "Pagamento",
      contract: "Contrato",
      technical: "Técnico",
      complaint: "Reclamação",
    };
    return labels[category] || category;
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suporte"
        description="Gerenciar tickets de suporte"
        actions={
          <Button variant="outline" onClick={fetchTickets}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total"
          value={stats.total}
          icon={<IconHeadphones className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Abertos"
          value={stats.open}
          description="Aguardando atendimento"
          icon={<IconAlertTriangle className="h-5 w-5" />}
          loading={loading}
          className="border-destructive/20"
        />
        <StatsCard
          title="Em Progresso"
          value={stats.inProgress}
          icon={<IconClock className="h-5 w-5" />}
          loading={loading}
          className="border-primary/20"
        />
        <StatsCard
          title="Resolvidos"
          value={stats.resolved}
          icon={<IconCheck className="h-5 w-5" />}
          loading={loading}
          className="border-success/20"
        />
        <StatsCard
          title="Urgentes"
          value={stats.urgent}
          icon={<IconAlertTriangle className="h-5 w-5" />}
          loading={loading}
          className="border-warning/20"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por assunto, nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="waiting_user">Aguardando</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tickets de Suporte</CardTitle>
          <CardDescription>
            {filteredTickets.length} ticket(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <IconHeadphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum ticket encontrado</p>
              <p className="text-sm mt-2">Os tickets de suporte aparecerão aqui quando os utilizadores os criarem.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setDetailsOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-cyan-100 text-cyan-700">
                          {ticket.userName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(ticket.category)}
                          </Badge>
                        </div>
                        <h3 className="font-medium">{ticket.subject}</h3>
                        <p className="text-sm text-slate-500 line-clamp-1">{ticket.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <IconUser className="h-3 w-3" />
                            {ticket.userName}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconMail className="h-3 w-3" />
                            {ticket.userEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconClock className="h-3 w-3" />
                            {new Date(ticket.createdAt).toLocaleDateString("pt-PT")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicket(ticket);
                      setDetailsOpen(true);
                    }}>
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              Ticket #{selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
                <Badge variant="outline">{getCategoryLabel(selectedTicket.category)}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Utilizador</p>
                  <p className="font-medium">{selectedTicket.userName}</p>
                  <p className="text-slate-500">{selectedTicket.userEmail}</p>
                </div>
                <div>
                  <p className="text-slate-500">Criado em</p>
                  <p className="font-medium">
                    {new Date(selectedTicket.createdAt).toLocaleString("pt-PT")}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-slate-500 text-sm mb-2">Descrição</p>
                <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  {selectedTicket.description}
                </p>
              </div>
              
              {selectedTicket.resolvedAt && (
                <div>
                  <p className="text-slate-500 text-sm mb-2">Resolução</p>
                  <p className="text-sm bg-success/10 p-3 rounded-lg text-success">
                    Resolvido em {new Date(selectedTicket.resolvedAt).toLocaleString("pt-PT")}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            {selectedTicket?.status !== "resolved" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleUpdateStatus(selectedTicket!.id, "in_progress");
                  }}
                  disabled={updating}
                >
                  Em Progresso
                </Button>
                <Button
                  onClick={() => {
                    setDetailsOpen(false);
                    setResolveDialogOpen(true);
                  }}
                  disabled={updating}
                >
                  <IconCheck className="h-4 w-4 mr-2" />
                  Resolver
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Ticket</DialogTitle>
            <DialogDescription>
              Adicione uma resolução para este ticket
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolução</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Descreva como o ticket foi resolvido..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => handleUpdateStatus(selectedTicket?.id || "", "resolved")}
              disabled={updating || !resolution.trim()}
            >
              {updating ? "A resolver..." : "Resolver Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
