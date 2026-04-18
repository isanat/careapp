"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/admin/common/stats-card";
import { PageHeader } from "@/components/admin/common/page-header";
import { BloomCard } from "@/components/bloom-custom/BloomCard";
import { BloomBadge } from "@/components/bloom-custom/BloomBadge";
import { BloomSectionHeader } from "@/components/bloom-custom/BloomSectionHeader";
import { Button } from "@/components/ui/button";
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
import { apiFetch } from "@/lib/api-client";

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
      const response = await apiFetch("/api/admin/dashboard/stats");
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
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
        <motion.div
          variants={itemVariants}
          className="rounded-lg bg-destructive/5 p-5 sm:p-6 md:p-7 text-destructive"
        >
          {error}
        </motion.div>
      )}

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </motion.div>

      {/* Alerts Section */}
      <motion.div variants={itemVariants}>
        <BloomCard variant="warning">
          <div className="p-5 sm:p-6 md:p-7">
            <div className="mb-6 flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="text-lg font-semibold text-foreground">Alertas Pendentes</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Link
                href="/admin/caregivers?status=pending"
                className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 transition-all hover:bg-card hover:border-primary/50"
              >
                <span className="text-sm">KYC Pendente</span>
                <BloomBadge variant="warning">{stats?.alerts.pendingKyc || 0}</BloomBadge>
              </Link>
              <Link
                href="/admin/contracts?status=disputed"
                className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 transition-all hover:bg-card hover:border-primary/50"
              >
                <span className="text-sm">Disputas</span>
                <BloomBadge variant="destructive">{stats?.alerts.pendingDisputes || 0}</BloomBadge>
              </Link>
              <Link
                href="/admin/payments?status=refund"
                className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 transition-all hover:bg-card hover:border-primary/50"
              >
                <span className="text-sm">Reembolsos</span>
                <BloomBadge variant="warning">{stats?.alerts.pendingRefunds || 0}</BloomBadge>
              </Link>
              <Link
                href="/admin/moderation"
                className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 transition-all hover:bg-card hover:border-primary/50"
              >
                <span className="text-sm">Conteúdo Sinalizado</span>
                <BloomBadge variant="warning">{stats?.alerts.flaggedContent || 0}</BloomBadge>
              </Link>
            </div>
          </div>
        </BloomCard>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BloomCard variant="interactive">
          <div className="p-5 sm:p-6 md:p-7 space-y-6">
            <BloomSectionHeader title="Ações Rápidas" />
            <div className="space-y-2">
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
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/demands">
                  Marketplace de Demandas <IconArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </BloomCard>

        <BloomCard variant="default">
          <div className="p-5 sm:p-6 md:p-7 space-y-6">
            <BloomSectionHeader title="Contratos por Status" />
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
                  <BloomBadge variant="default">{stats?.kpis.activeContracts || 0}</BloomBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Em Disputa</span>
                  <BloomBadge variant="destructive">{stats?.kpis.pendingDisputes || 0}</BloomBadge>
                </div>
              </div>
            )}
          </div>
        </BloomCard>

        <BloomCard variant="default">
          <div className="p-5 sm:p-6 md:p-7 space-y-6">
            <BloomSectionHeader title="Saúde do Sistema" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Banco de Dados</span>
                <BloomBadge variant={stats?.health.database === "healthy" ? "success" : "destructive"}>
                  {stats?.health.database === "healthy" ? "OK" : "Erro"}
                </BloomBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Stripe</span>
                <BloomBadge variant={stats?.health.stripe === "healthy" ? "success" : "destructive"}>
                  {stats?.health.stripe === "healthy" ? "OK" : "Erro"}
                </BloomBadge>
              </div>
            </div>
          </div>
        </BloomCard>
      </motion.div>
    </motion.div>
  );
}
