"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/common/page-header";
import { StatsCard } from "@/components/admin/common/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconCreditCard,
  IconRefresh,
  IconDownload,
  IconExternalLink,
  IconCoin,
  IconTrendingUp,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from "@/components/icons";
import { StatusBadge } from "@/components/admin/common/status-badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  status: string;
  provider: string;
  amountEurCents: number;
  tokensAmount: number;
  contractId: string | null;
  contractTitle: string | null;
  createdAt: string;
  paidAt: string | null;
  refundedAt: string | null;
  stripePaymentIntentId: string | null;
}

interface PaymentStats {
  today: number;
  thisMonth: number;
  pendingRefunds: number;
  totalRevenue: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const [paymentsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/payments?${params}`),
        fetch("/api/admin/payments/stats"),
      ]);

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data.payments || []);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ACTIVATION: "Ativação",
      TOKEN_PURCHASE: "Compra Tokens",
      CONTRACT_FEE: "Taxa Contrato",
      SERVICE_PAYMENT: "Pagamento Serviço",
      REDEMPTION: "Resgate",
    };
    return labels[type] || type;
  };

  const handleRefund = async (paymentId: string) => {
    const reason = prompt("Motivo do reembolso:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao processar reembolso");
      }
    } catch (error) {
      alert("Erro ao processar reembolso");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagamentos"
        description="Gerencie transações e reembolsos"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Hoje"
          value={formatCurrency(stats?.today || 0)}
          icon={<IconCreditCard className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Este Mês"
          value={formatCurrency(stats?.thisMonth || 0)}
          icon={<IconTrendingUp className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Reembolsos Pendentes"
          value={stats?.pendingRefunds || 0}
          icon={<IconAlertTriangle className="h-5 w-5" />}
          variant="warning"
          loading={loading}
        />
        <StatsCard
          title="Receita Total"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={<IconCoin className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData()}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="ACTIVATION">Ativação</SelectItem>
                <SelectItem value="TOKEN_PURCHASE">Compra Tokens</SelectItem>
                <SelectItem value="CONTRACT_FEE">Taxa Contrato</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="COMPLETED">Concluído</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="FAILED">Falhou</SelectItem>
                <SelectItem value="REFUNDED">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchData}>Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Usuário</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Valor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tokens</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Nenhum pagamento encontrado
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono text-sm">
                        {payment.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{payment.userName}</p>
                          <p className="text-xs text-slate-500">{payment.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{getTypeLabel(payment.type)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            payment.status === "COMPLETED"
                              ? "completed"
                              : payment.status === "PENDING"
                              ? "pending"
                              : payment.status === "FAILED"
                              ? "failed"
                              : payment.status === "REFUNDED"
                              ? "refunded"
                              : "processing"
                          }
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(payment.amountEurCents)}
                      </td>
                      <td className="px-4 py-3">
                        {payment.tokensAmount?.toLocaleString() || 0} SENT
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {payment.stripePaymentIntentId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `https://dashboard.stripe.com/payments/${payment.stripePaymentIntentId}`,
                                  "_blank"
                                )
                              }
                            >
                              <IconExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {payment.status === "COMPLETED" && !payment.refundedAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRefund(payment.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Reembolsar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
