"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/common/page-header";
import { StatsCard } from "@/components/admin/common/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconUsers,
  IconRefresh,
  IconDownload,
  IconTrendingUp,
  IconTrendingDown,
  IconCoin,
  IconCreditCard,
  IconFileText,
} from "@/components/icons";

interface AnalyticsData {
  kpis: {
    totalUsers: number;
    newUsersMonth: number;
    usersGrowth: number;
    totalRevenue: number;
    revenueGrowth: number;
    activeContracts: number;
    contractsGrowth: number;
    tokensIssued: number;
    tokensGrowth: number;
  };
  revenueChart: Array<{ date: string; revenue: number }>;
  usersChart: Array<{ date: string; users: number }>;
  contractsByStatus: Array<{ status: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  topCaregivers: Array<{ name: string; rating: number; contracts: number; revenue: number }>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/overview?days=${period}`);
      if (response.ok) {
        setData(await response.json());
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const exportData = () => {
    // Simple CSV export
    if (!data) return;
    
    const csvRows = [
      ["Métrica", "Valor"],
      ["Total Usuários", data.kpis.totalUsers],
      ["Novos Usuários (Mês)", data.kpis.newUsersMonth],
      ["Receita Total", formatCurrency(data.kpis.totalRevenue)],
      ["Contratos Ativos", data.kpis.activeContracts],
      ["Tokens Emitidos", data.kpis.tokensIssued],
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Métricas e relatórios da plataforma"
        actions={
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportData}>
              <IconDownload className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" onClick={fetchData}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Usuários"
          value={data?.kpis.totalUsers || 0}
          change={`${data?.kpis.usersGrowth > 0 ? "+" : ""}${data?.kpis.usersGrowth || 0}%`}
          trend={data?.kpis.usersGrowth > 0 ? "up" : data?.kpis.usersGrowth < 0 ? "down" : "neutral"}
          icon={<IconUsers className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Receita Total"
          value={formatCurrency(data?.kpis.totalRevenue || 0)}
          change={`${data?.kpis.revenueGrowth > 0 ? "+" : ""}${data?.kpis.revenueGrowth || 0}%`}
          trend={data?.kpis.revenueGrowth > 0 ? "up" : data?.kpis.revenueGrowth < 0 ? "down" : "neutral"}
          icon={<IconCreditCard className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Contratos Ativos"
          value={data?.kpis.activeContracts || 0}
          change={`${data?.kpis.contractsGrowth > 0 ? "+" : ""}${data?.kpis.contractsGrowth || 0}%`}
          trend={data?.kpis.contractsGrowth > 0 ? "up" : data?.kpis.contractsGrowth < 0 ? "down" : "neutral"}
          icon={<IconFileText className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Tokens Emitidos"
          value={(data?.kpis.tokensIssued || 0).toLocaleString()}
          description="SENT em circulação"
          icon={<IconCoin className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="h-48 flex items-end gap-1">
                {data?.revenueChart?.slice(-14).map((item, i) => {
                  const maxRevenue = Math.max(...(data?.revenueChart?.map(d => d.revenue) || [1]));
                  const height = (item.revenue / maxRevenue) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-cyan-500 rounded-t"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${formatCurrency(item.revenue)}`}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crescimento de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="h-48 flex items-end gap-1">
                {data?.usersChart?.slice(-14).map((item, i) => {
                  const maxUsers = Math.max(...(data?.usersChart?.map(d => d.users) || [1]));
                  const height = (item.users / maxUsers) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-green-500 rounded-t"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${item.users} usuários`}
                  />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Contracts by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contratos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data?.contractsByStatus?.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm">{item.status}</span>
                    <Badge>{item.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Cidades</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data?.topCities?.slice(0, 5).map((item, i) => (
                  <div key={item.city} className="flex items-center justify-between">
                    <span className="text-sm">
                      {i + 1}. {item.city}
                    </span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Caregivers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Cuidadores</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data?.topCaregivers?.slice(0, 5).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-6">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        ⭐ {item.rating.toFixed(1)} • {item.contracts} contratos
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
