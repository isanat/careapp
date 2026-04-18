"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/admin/common/page-header";
import { StatsCard } from "@/components/admin/common/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconCoins,
  IconHeartHandshake,
  IconTrendingUp,
  IconRefresh,
  IconDownload,
  IconBarChart,
  IconCheck,
  IconEye,
} from "@/components/icons";

interface KPIs {
  totalDemandsCreated: number;
  activeDemands: number;
  closedDemands: number;
  pausedDemands: number;
  totalRevenueEur: string;
  totalRevenueCents: number;
  completedPurchases: number;
  pendingPurchases: number;
  avgTicketEur: string;
  totalViews: number;
  totalProposals: number;
  acceptedProposals: number;
  conversionRatePercentage: string;
  boostConversionPercentage: string;
  avgViewsPerDemand: string;
  avgProposalsPerDemand: string;
}

interface ApiResponse {
  period: string;
  kpis: KPIs;
  packageBreakdown: Array<{
    package: string;
    count: number;
    revenueCents: number;
    revenueEur: number;
  }>;
  dailyRevenueData: Array<{
    date: string;
    revenueCents: number;
    revenueEur: string;
  }>;
  health: {
    hasData: boolean;
    activeSystem: boolean;
    revenueGenerated: boolean;
  };
}

export default function AdminDemandsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  const fetchMetrics = async (p: "today" | "week" | "month") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/demands/metrics?period=${p}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch metrics");
      }
      const responseData = await res.json();
      setData(responseData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar métricas",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(period);
  }, [period]);

  const handleExportCSV = async () => {
    try {
      if (!data) return;

      const { kpis, dailyRevenueData } = data;
      const rows = [
        ["Dashboard de Demandas - Relatório"],
        [
          `Período: ${period === "week" ? "Últimos 7 dias" : period === "month" ? "Últimos 30 dias" : "Hoje"}`,
        ],
        [],
        ["MÉTRICAS GLOBAIS"],
        ["Receita Total", `€${kpis.totalRevenueEur}`],
        ["Demandas Criadas", kpis.totalDemandsCreated.toString()],
        [
          "Taxa Conversão (views→propostas)",
          `${kpis.conversionRatePercentage}%`,
        ],
        [
          "Taxa Conversão (demandas→boosts)",
          `${kpis.boostConversionPercentage}%`,
        ],
        ["Ticket Médio", `€${kpis.avgTicketEur}`],
        ["Visualizações Totais", kpis.totalViews.toString()],
        ["Propostas Totais", kpis.totalProposals.toString()],
        [],
        ["RECEITA DIÁRIA"],
        ["Data", "Receita"],
        ...dailyRevenueData.map((d) => [d.date, `€${d.revenueEur}`]),
      ];

      const csvContent = rows
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `demands-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao exportar CSV",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (valueStr: string) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(parseFloat(valueStr));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace de Demandas"
        description="Análise de demandas, visibilidade e receita"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchMetrics(period)}
              disabled={loading}
            >
              <IconRefresh className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={loading || !data}
            >
              <IconDownload className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Period Selector */}
      <div className="flex gap-2">
        {["today", "week", "month"].map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            onClick={() => setPeriod(p as "today" | "week" | "month")}
            disabled={loading}
          >
            {p === "week" && "Últimos 7 dias"}
            {p === "month" && "Últimos 30 dias"}
            {p === "today" && "Hoje"}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Carregando métricas...
          </p>
        </div>
      )}

      {/* KPI Cards */}
      {data && !loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Receita Total"
            value={formatCurrency(data.kpis.totalRevenueEur)}
            change={`${data.kpis.completedPurchases} boosts pagos`}
            trend="up"
            icon={<IconCoins className="h-6 w-6" />}
            loading={loading}
          />
          <StatsCard
            title="Demandas Criadas"
            value={data.kpis.totalDemandsCreated.toString()}
            change={`${data.kpis.activeDemands} ativas`}
            trend="up"
            icon={<IconBarChart className="h-6 w-6" />}
            loading={loading}
          />
          <StatsCard
            title="Taxa Boost"
            value={`${data.kpis.boostConversionPercentage}%`}
            change="demandas com visibilidade paga"
            trend="neutral"
            icon={<IconTrendingUp className="h-6 w-6" />}
            loading={loading}
          />
          <StatsCard
            title="Ticket Médio"
            value={formatCurrency(data.kpis.avgTicketEur)}
            change="por visibilidade comprada"
            trend="neutral"
            icon={<IconEye className="h-6 w-6" />}
            loading={loading}
          />
        </div>
      )}

      {/* Revenue Chart */}
      {data && data.dailyRevenueData.length > 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Receita Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.dailyRevenueData.map((point, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {point.date}
                  </span>
                  <div className="flex items-center gap-4">
                    <div
                      className="h-2 bg-primary rounded-full"
                      style={{
                        width: `${(point.revenueCents / Math.max(...data.dailyRevenueData.map((d) => d.revenueCents || 1))) * 200 || 2}px`,
                      }}
                    />
                    <span className="text-sm font-medium text-foreground w-20 text-right">
                      €{point.revenueEur}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement Metrics & Package Breakdown */}
      {data && !loading && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconEye className="h-5 w-5" />
                Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Visualizações
                  </span>
                  <span className="font-semibold">{data.kpis.totalViews}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Propostas Enviadas
                  </span>
                  <span className="font-semibold">
                    {data.kpis.totalProposals}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Propostas Aceitas
                  </span>
                  <span className="font-semibold">
                    {data.kpis.acceptedProposals}
                  </span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-sm font-medium">Taxa de Conversão</span>
                  <span className="font-semibold text-lg text-primary">
                    {data.kpis.conversionRatePercentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCoins className="h-5 w-5" />
                Receita por Pacote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.packageBreakdown.map((pkg, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={pkg.package === "NONE" ? "outline" : "default"}
                      >
                        {pkg.package === "NONE" && "Sem Boost"}
                        {pkg.package === "BASIC" && "7 dias"}
                        {pkg.package === "PREMIUM" && "30 dias"}
                        {pkg.package === "URGENT" && "Urgente"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{pkg.count}</div>
                      <div className="text-xs text-muted-foreground">
                        €{pkg.revenueEur.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBarChart className="h-5 w-5" />
                Status das Demandas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ativas</span>
                  <span className="font-semibold text-success">
                    {data.kpis.activeDemands}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Fechadas
                  </span>
                  <span className="font-semibold">
                    {data.kpis.closedDemands}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Pausadas
                  </span>
                  <span className="font-semibold">
                    {data.kpis.pausedDemands}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Averages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTrendingUp className="h-5 w-5" />
                Médias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Views/Demanda
                  </span>
                  <span className="font-semibold">
                    {data.kpis.avgViewsPerDemand}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Propostas/Demanda
                  </span>
                  <span className="font-semibold">
                    {data.kpis.avgProposalsPerDemand}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Compras Pendentes
                  </span>
                  <span className="font-semibold">
                    {data.kpis.pendingPurchases}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
