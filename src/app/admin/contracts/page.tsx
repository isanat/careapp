"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/common/page-header";
import { DataTable, Column } from "@/components/admin/common/data-table";
import { StatusBadge } from "@/components/admin/common/status-badge";
import { StatsCard } from "@/components/admin/common/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  IconFile,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconEye,
  IconClock,
  IconEuro,
  IconUsers,
  IconLoader2
} from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface Contract {
  id: string;
  title: string;
  status: string;
  totalEurCents: number;
  totalTokens: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  familyName: string;
  familyEmail: string;
  caregiverName: string;
  caregiverEmail: string;
}

interface Stats {
  total: number;
  active: number;
  disputed: number;
  completed: number;
}

export default function AdminContractsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, disputed: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());

      const response = await fetch(`/api/admin/contracts?${params}`);
      const data = await response.json();
      setContracts(data.contracts || []);
      setStatusCounts(data.statusCounts || {});
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
      }));

      // Calculate stats
      const counts = data.statusCounts || {};
      setStats({
        total: Object.values(counts).reduce((a: number, b: unknown) => a + (b as number), 0) as number,
        active: counts['ACTIVE'] || 0,
        disputed: counts['DISPUTED'] || 0,
        completed: counts['COMPLETED'] || 0,
      });
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar contratos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [statusFilter, pagination.page]);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-PT");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <StatusBadge status="active" />;
      case 'COMPLETED': return <StatusBadge status="completed" />;
      case 'CANCELLED': return <StatusBadge status="cancelled" />;
      case 'DISPUTED': return <StatusBadge status="disputed" />;
      case 'PENDING_ACCEPTANCE': return <StatusBadge status="pending" />;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCancel = async (contractId: string) => {
    const reason = prompt('Motivo do cancelamento:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/contracts/${contractId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to cancel');

      toast({
        title: "Sucesso",
        description: "Contrato cancelado com sucesso",
      });
      fetchContracts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao cancelar contrato",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Contract>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-24",
      render: (c) => (
        <span className="font-mono text-xs text-muted-foreground">
          {c.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "title",
      header: "Título",
      render: (c) => (
        <div>
          <p className="font-medium">{c.title}</p>
          {c.status === 'DISPUTED' && (
            <Badge variant="destructive" className="mt-1 text-xs">
              <IconAlertCircle className="h-3 w-3 mr-1" />
              Em disputa
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "familyName",
      header: "Família",
      render: (c) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.familyName}`} />
            <AvatarFallback>{c.familyName?.charAt(0) || "F"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{c.familyName || "-"}</p>
            <p className="text-xs text-muted-foreground">{c.familyEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: "caregiverName",
      header: "Cuidador",
      render: (c) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.caregiverName}`} />
            <AvatarFallback>{c.caregiverName?.charAt(0) || "C"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{c.caregiverName || "-"}</p>
            <p className="text-xs text-muted-foreground">{c.caregiverEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => getStatusBadge(c.status),
    },
    {
      key: "totalEurCents",
      header: "Valor",
      render: (c) => (
        <div>
          <p className="font-medium">{formatCurrency(c.totalEurCents)}</p>
          {c.totalTokens > 0 && (
            <p className="text-xs text-muted-foreground">{c.totalTokens} tokens</p>
          )}
        </div>
      ),
    },
    {
      key: "dates",
      header: "Período",
      render: (c) => (
        <div className="text-sm">
          <p>{formatDate(c.startDate)}</p>
          {c.endDate && <p className="text-muted-foreground">até {formatDate(c.endDate)}</p>}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Criado",
      render: (c) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(c.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      className: "w-32",
      render: (c) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/admin/contracts/${c.id}`)}
          >
            <IconEye className="h-4 w-4" />
          </Button>
          {(c.status === 'ACTIVE' || c.status === 'PENDING_ACCEPTANCE') && (
            <Button
              size="sm"
              variant="destructive"
              className="h-8 w-8 p-0"
              onClick={() => handleCancel(c.id)}
            >
              <IconX className="h-4 w-4" />
            </Button>
          )}
          {c.status === 'DISPUTED' && (
            <Link href={`/admin/contracts/${c.id}?tab=dispute`}>
              <Button size="sm" variant="default" className="h-8 px-2">
                Resolver
              </Button>
            </Link>
          )}
        </div>
      ),
    },
  ];

  const statusTabs = [
    { key: "", label: "Todos", icon: IconFile },
    { key: "PENDING_ACCEPTANCE", label: "Pendente", icon: IconClock },
    { key: "ACTIVE", label: "Ativos", icon: IconCheck },
    { key: "DISPUTED", label: "Disputas", icon: IconAlertCircle, count: statusCounts['DISPUTED'] },
    { key: "COMPLETED", label: "Concluídos", icon: IconCheck },
    { key: "CANCELLED", label: "Cancelados", icon: IconX },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Gerencie todos os contratos da plataforma"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total de Contratos"
          value={stats.total}
          icon={<IconFile className="h-5 w-5" />}
        />
        <StatsCard
          title="Contratos Ativos"
          value={stats.active}
          variant="success"
          icon={<IconCheck className="h-5 w-5" />}
        />
        <StatsCard
          title="Em Disputa"
          value={stats.disputed}
          variant="danger"
          icon={<IconAlertCircle className="h-5 w-5" />}
        />
        <StatsCard
          title="Concluídos"
          value={stats.completed}
          icon={<IconCheck className="h-5 w-5" />}
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={statusFilter === tab.key ? "default" : "outline"}
            onClick={() => setStatusFilter(tab.key)}
            className="gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <Badge variant="destructive" className="ml-1">
                {tab.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={contracts}
        keyExtractor={(c) => c.id}
        loading={loading}
        emptyMessage="Nenhum contrato encontrado"
        onRowClick={(c) => router.push(`/admin/contracts/${c.id}`)}
        pagination={{
          page: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
        }}
      />
    </div>
  );
}
