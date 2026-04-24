"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DemandActionsDropdown } from "@/components/demands/demand-actions-dropdown";
import {
  BloomCard,
  BloomBadge,
  BloomStatBlock,
  BloomSectionDivider,
  BloomEmpty,
} from "@/components/bloom-custom";
import {
  IconPlus,
  IconMapPin,
  IconEye,
  IconMessageSquare,
  IconTrendingUp,
  IconEuro,
  IconChevronRight,
  IconAlertCircle,
  IconCheck,
  IconStar,
  IconBarChart,
  IconCalendar,
  IconTrendingDown,
} from "@/components/icons";

interface DemandMetrics {
  viewCount: number;
  proposalCount: number;
  conversionRate: number;
  visibilitySpent: string;
}

interface Demand {
  id: string;
  title: string;
  description: string;
  city: string;
  status: string;
  visibilityPackage: string;
  visibilityExpiresAt: string | null;
  createdAt: string;
  closedAt: string | null;
  metrics: DemandMetrics;
}

interface FamilyAnalytics {
  totalVisibilitySpent: number;
  avgProposalsPerDemand: number;
  avgViewsPerDemand: number;
  activeDemands: number;
  closedDemands: number;
}

function FamilyDemandsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [analytics, setAnalytics] = useState<FamilyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const demandsRes = await fetch(
          `/api/family/demands?status=${statusFilter}`,
        );
        if (!demandsRes.ok) throw new Error("Failed to fetch demands");
        const demandsData = await demandsRes.json();
        setDemands(demandsData.demands);

        const analyticsRes = await fetch("/api/family/demands/analytics");
        if (!analyticsRes.ok) throw new Error("Failed to fetch analytics");
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, statusFilter]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-3xl p-5 sm:p-7 border-2 border-destructive/30 bg-destructive/5 flex items-center gap-3 shadow-card">
          <IconAlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 md:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2 tracking-tighter leading-none">
            Suas Demandas
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Gerencie e acompanhe todas as suas demandas de serviços de cuidados
          </p>
        </div>
        <Button asChild className="rounded-2xl gap-2 h-10">
          <Link href="/app/family/demands/new">
            <IconPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Criar Demanda</span>
            <span className="sm:hidden">Nova</span>
          </Link>
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          <BloomStatBlock
            label="Ativas"
            value={analytics.activeDemands}
            icon={<IconCheck className="h-6 w-6" />}
            colorClass="text-success"
          />

          <BloomStatBlock
            label="Fechadas"
            value={analytics.closedDemands}
            icon={<IconCalendar className="h-6 w-6" />}
            colorClass="text-secondary"
          />

          <BloomStatBlock
            label="Gasto"
            value={`€${analytics.totalVisibilitySpent.toFixed(0)}`}
            icon={<IconEuro className="h-6 w-6" />}
            colorClass="text-primary"
          />

          <BloomStatBlock
            label="Propostas"
            value={analytics.avgProposalsPerDemand.toFixed(1)}
            icon={<IconMessageSquare className="h-6 w-6" />}
            colorClass="text-accent"
          />

          <BloomStatBlock
            label="Vistas"
            value={analytics.avgViewsPerDemand.toFixed(1)}
            icon={<IconEye className="h-6 w-6" />}
            colorClass="text-secondary"
          />
        </div>
      )}

      {/* Tabs Section */}
      <Tabs
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="w-full space-y-6"
      >
        <TabsList className="w-full grid grid-cols-3 h-11 rounded-2xl bg-muted/50 p-1 border border-border/30">
          <TabsTrigger
            value="ACTIVE"
            className="rounded-xl text-xs font-display font-black uppercase tracking-widest data-[state=active]:shadow-sm data-[state=active]:bg-background data-[state=active]:text-foreground transition-all"
          >
            Ativas ({demands.filter((d) => d.status === "ACTIVE").length})
          </TabsTrigger>
          <TabsTrigger
            value="CLOSED"
            className="rounded-xl text-xs font-display font-black uppercase tracking-widest data-[state=active]:shadow-sm data-[state=active]:bg-background data-[state=active]:text-foreground transition-all"
          >
            Fechadas ({demands.filter((d) => d.status === "CLOSED").length})
          </TabsTrigger>
          <TabsTrigger
            value="PAUSED"
            className="rounded-xl text-xs font-display font-black uppercase tracking-widest data-[state=active]:shadow-sm data-[state=active]:bg-background data-[state=active]:text-foreground transition-all"
          >
            Pausadas ({demands.filter((d) => d.status === "PAUSED").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-0">
          {demands.length === 0 ? (
            <BloomEmpty
              icon={
                statusFilter === "ACTIVE" ? (
                  <IconStar className="h-8 w-8" />
                ) : statusFilter === "CLOSED" ? (
                  <IconCheck className="h-8 w-8" />
                ) : (
                  <IconCalendar className="h-8 w-8" />
                )
              }
              title="Nenhuma demanda neste status"
              description={
                statusFilter === "ACTIVE"
                  ? "Crie sua primeira demanda para atrair cuidadores qualificados"
                  : statusFilter === "CLOSED"
                    ? "Aqui aparecerão suas demandas concluídas e fechadas"
                    : "Você ainda não pausou nenhuma demanda"
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {demands.map((demand) => {
                const visibilityConfig: Record<
                  string,
                  {
                    badgeVariant:
                      | "primary"
                      | "success"
                      | "warning"
                      | "destructive"
                      | "secondary"
                      | "info"
                      | "muted";
                    label: string;
                  }
                > = {
                  URGENT: { badgeVariant: "destructive", label: "Urgente" },
                  PREMIUM: { badgeVariant: "primary", label: "Premium" },
                  BASIC: { badgeVariant: "secondary", label: "Básico" },
                };

                const config = visibilityConfig[
                  demand.visibilityPackage as keyof typeof visibilityConfig
                ] || { badgeVariant: "muted" as const, label: "" };

                return (
                  <Link
                    key={demand.id}
                    href={`/app/family/demands/${demand.id}`}
                    className="group"
                  >
                    <BloomCard
                      variant="interactive"
                      className="p-5 sm:p-7 flex flex-col gap-4 h-full"
                    >
                      {/* Title, Description, Badge */}
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <h3 className="text-lg font-display font-black text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {demand.title}
                          </h3>

                          {/* Visibility Badge & Location */}
                          <div className="flex flex-wrap gap-2 items-center">
                            {config.label && (
                              <BloomBadge variant={config.badgeVariant}>
                                {config.label}
                              </BloomBadge>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <IconMapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{demand.city}</span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {demand.description}
                        </p>
                      </div>

                      {/* Metrics & Actions */}
                      <div className="flex flex-col gap-4 pt-2 border-t border-border/50">
                        {/* Metrics Row */}
                        <div className="flex justify-between gap-4">
                          <div className="flex flex-col items-center gap-1">
                            <IconEye className="h-4 w-4 text-secondary" />
                            <p className="text-sm font-display font-black text-foreground">
                              {demand.metrics.viewCount}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-display font-black uppercase tracking-widest">
                              Vistas
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-1">
                            <IconMessageSquare className="h-4 w-4 text-accent" />
                            <p className="text-sm font-display font-black text-foreground">
                              {demand.metrics.proposalCount}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-display font-black uppercase tracking-widest">
                              Propostas
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-1">
                            <IconEuro className="h-4 w-4 text-primary" />
                            <p className="text-sm font-display font-black text-foreground">
                              €{demand.metrics.visibilitySpent}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-display font-black uppercase tracking-widest">
                              Investido
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full">
                          <Link
                            href={`/app/family/demands/${demand.id}/boost?package=BASIC`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1"
                          >
                            <Button
                              size="sm"
                              className="w-full rounded-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconEuro className="h-3.5 w-3.5 mr-1.5" />
                              <span className="hidden xs:inline">Boost</span>
                            </Button>
                          </Link>
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0"
                          >
                            <DemandActionsDropdown
                              demandId={demand.id}
                              demandTitle={demand.title}
                              onActionComplete={() => {}}
                            />
                          </div>
                        </div>
                      </div>
                    </BloomCard>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function FamilyDemandsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="space-y-4 py-8 px-4 md:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-muted rounded-2xl" />
              <div className="h-64 bg-muted rounded-2xl" />
            </div>
          </div>
        }
      >
        <FamilyDemandsContent />
      </Suspense>
    </AppShell>
  );
}
