"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatsCard } from "@/components/admin/common/stats-card";
import { PageHeader } from "@/components/admin/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconUsers,
  IconHeartHandshake,
  IconCoins,
  IconCreditCard,
  IconAlertTriangle,
  IconArrowRight,
  IconRefresh,
} from "@/components/icons";
import Link from "next/link";

interface DashboardStats {
  kpis: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    totalCaregivers: number;
    verifiedCaregivers: number;
    activeContracts: number;
    pendingDisputes: number;
    totalRevenueEur: number;
    revenueToday: number;
    tokensInCirculation: number;
    reserveEur: number;
  };
  alerts: {
    pendingKyc: number;
    pendingDisputes: number;
    pendingRefunds: number;
    flaggedContent: number;
  };
  health: {
    database: string;
    stripe: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-PT").format(num);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da plataforma"
        actions={
          <Button variant="outline" onClick={fetchStats} disabled={loading}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Usuários"
          value={formatNumber(stats?.kpis.totalUsers || 0)}
          change={`+${stats?.kpis.newUsersToday || 0} hoje`}
          trend="up"
          icon={<IconUsers className="h-6 w-6" />}
          loading={loading}
        />
        <StatsCard
          title="Cuidadores"
          value={formatNumber(stats?.kpis.totalCaregivers || 0)}
          change={`${stats?.kpis.verifiedCaregivers || 0} verificados`}
          trend="up"
          icon={<IconHeartHandshake className="h-6 w-6" />}
          loading={loading}
        />
        <StatsCard
          title="Receita Total"
          value={formatCurrency(stats?.kpis.totalRevenueEur || 0)}
          change={`${formatCurrency(stats?.kpis.revenueToday || 0)} hoje`}
          trend="up"
          icon={<IconCreditCard className="h-6 w-6" />}
          loading={loading}
        />
        <StatsCard
          title="Tokens em Circulação"
          value={formatNumber(stats?.kpis.tokensInCirculation || 0)}
          description="SENT"
          icon={<IconCoins className="h-6 w-6" />}
          loading={loading}
        />
      </div>

      {/* Alerts Section */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <IconAlertTriangle className="h-5 w-5" />
            Alertas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link
              href="/admin/caregivers?status=pending"
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 dark:border-amber-800 dark:bg-slate-800"
            >
              <span className="text-sm">KYC Pendente</span>
              <Badge className="bg-amber-500">{stats?.alerts.pendingKyc || 0}</Badge>
            </Link>
            <Link
              href="/admin/contracts?status=disputed"
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 dark:border-amber-800 dark:bg-slate-800"
            >
              <span className="text-sm">Disputas</span>
              <Badge className="bg-red-500">{stats?.alerts.pendingDisputes || 0}</Badge>
            </Link>
            <Link
              href="/admin/payments?status=refund"
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 dark:border-amber-800 dark:bg-slate-800"
            >
              <span className="text-sm">Reembolsos</span>
              <Badge className="bg-amber-500">{stats?.alerts.pendingRefunds || 0}</Badge>
            </Link>
            <Link
              href="/admin/moderation"
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 dark:border-amber-800 dark:bg-slate-800"
            >
              <span className="text-sm">Conteúdo Sinalizado</span>
              <Badge className="bg-amber-500">{stats?.alerts.flaggedContent || 0}</Badge>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/admin/users/new">
                Novo Usuário <IconArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/admin/caregivers?status=pending">
                Revisar KYC <IconArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/admin/contracts?status=disputed">
                Resolver Disputas <IconArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contratos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ativos</span>
                  <Badge>{stats?.kpis.activeContracts || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Em Disputa</span>
                  <Badge variant="destructive">{stats?.kpis.pendingDisputes || 0}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saúde do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Banco de Dados</span>
                <Badge className={stats?.health.database === "healthy" ? "bg-green-500" : "bg-red-500"}>
                  {stats?.health.database === "healthy" ? "OK" : "Erro"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Stripe</span>
                <Badge className={stats?.health.stripe === "healthy" ? "bg-green-500" : "bg-red-500"}>
                  {stats?.health.stripe === "healthy" ? "OK" : "Erro"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
