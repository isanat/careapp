'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/icons';

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
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch demands
        const demandsRes = await fetch(`/api/family/demands?status=${statusFilter}`);
        if (!demandsRes.ok) throw new Error('Failed to fetch demands');
        const demandsData = await demandsRes.json();
        setDemands(demandsData.demands);

        // Fetch analytics
        const analyticsRes = await fetch('/api/family/demands/analytics');
        if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, statusFilter]);

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
          <IconAlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Suas Demandas</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie e acompanhe todas as suas demandas de serviços de cuidados
            </p>
          </div>
          <Button asChild className="rounded-lg gap-2 h-9">
            <Link href="/app/family/demands/new">
              <IconPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Criar Demanda</span>
              <span className="sm:hidden">Nova</span>
            </Link>
          </Button>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Active Demands */}
            <Card className="border-border/40">
              <CardContent className="p-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Ativas</p>
                    <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center">
                      <IconCheck className="h-3.5 w-3.5 text-success" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{analytics.activeDemands}</p>
                </div>
              </CardContent>
            </Card>

            {/* Closed Demands */}
            <Card className="border-border/40">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Fechadas</p>
                    <div className="h-7 w-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <IconCalendar className="h-3.5 w-3.5 text-secondary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{analytics.closedDemands}</p>
                </div>
              </CardContent>
            </Card>

            {/* Total Spent */}
            <Card className="border-border/40">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Gasto</p>
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconEuro className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">€{analytics.totalVisibilitySpent.toFixed(0)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Avg Proposals */}
            <Card className="border-border/40">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Propostas</p>
                    <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                      <IconMessageSquare className="h-3.5 w-3.5 text-accent" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{analytics.avgProposalsPerDemand.toFixed(1)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Avg Views */}
            <Card className="border-border/40">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Vistas</p>
                    <div className="h-7 w-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <IconEye className="h-3.5 w-3.5 text-secondary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{analytics.avgViewsPerDemand.toFixed(1)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Section */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full space-y-4">
          <TabsList className="w-full grid grid-cols-3 h-10 rounded-lg bg-muted/50 p-1 border border-border/30">
            <TabsTrigger value="ACTIVE" className="rounded-md text-xs font-medium data-[state=active]:shadow-sm data-[state=active]:bg-background">
              Ativas ({demands.filter(d => d.status === 'ACTIVE').length})
            </TabsTrigger>
            <TabsTrigger value="CLOSED" className="rounded-md text-xs font-medium data-[state=active]:shadow-sm data-[state=active]:bg-background">
              Fechadas ({demands.filter(d => d.status === 'CLOSED').length})
            </TabsTrigger>
            <TabsTrigger value="PAUSED" className="rounded-md text-xs font-medium data-[state=active]:shadow-sm data-[state=active]:bg-background">
              Pausadas ({demands.filter(d => d.status === 'PAUSED').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-3 mt-0">
            {/* Empty State */}
            {demands.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border/40 py-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center mb-3 mx-auto">
                  {statusFilter === 'ACTIVE' && <IconStar className="h-6 w-6 text-muted-foreground" />}
                  {statusFilter === 'CLOSED' && <IconCheck className="h-6 w-6 text-muted-foreground" />}
                  {statusFilter === 'PAUSED' && <IconCalendar className="h-6 w-6 text-muted-foreground" />}
                </div>
                <p className="text-foreground font-semibold mb-1">Nenhuma demanda neste status</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {statusFilter === 'ACTIVE' && 'Crie sua primeira demanda para atrair cuidadores qualificados'}
                  {statusFilter === 'CLOSED' && 'Aqui aparecerão suas demandas concluídas e fechadas'}
                  {statusFilter === 'PAUSED' && 'Você ainda não pausou nenhuma demanda'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {demands.map(demand => {
                  const conversionRate = demand.metrics.conversionRate.toFixed(1);
                  const visibilityBadgeVariant =
                    demand.visibilityPackage === 'URGENT' ? 'destructive' :
                    demand.visibilityPackage === 'PREMIUM' ? 'default' :
                    demand.visibilityPackage === 'BASIC' ? 'secondary' :
                    'outline';

                  const visibilityBadgeIcon =
                    demand.visibilityPackage === 'URGENT' ? IconAlertCircle :
                    demand.visibilityPackage === 'PREMIUM' ? IconStar :
                    demand.visibilityPackage === 'BASIC' ? IconCheck :
                    undefined;

                  const VisibilityIcon = visibilityBadgeIcon;

                  return (
                    <Link key={demand.id} href={`/app/family/demands/${demand.id}`} className="group block">
                      <Card className="border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 md:gap-0 md:divide-x md:divide-border/30 items-center">
                            {/* Title & Description - 2 cols */}
                            <div className="lg:col-span-2 min-w-0 p-5 md:p-5">
                              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {demand.title}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <IconMapPin className="h-3 w-3 shrink-0" />
                                <p className="truncate">{demand.city}</p>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {demand.description}
                              </p>
                            </div>

                            {/* Visibility Package - 1 col */}
                            <div className="p-5 md:p-6">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Visibilidade</p>
                              <Badge
                                variant={visibilityBadgeVariant as any}
                                className="text-xs h-6 flex items-center justify-center gap-1 w-fit px-2"
                              >
                                {VisibilityIcon && <VisibilityIcon className="h-3 w-3" />}
                                {demand.visibilityPackage || 'Nenhum'}
                              </Badge>
                            </div>

                            {/* Views - 1 col */}
                            <div className="p-5 md:p-6 text-center">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Vistas</p>
                              <div className="flex items-center justify-center gap-1">
                                <IconEye className="h-3 w-3 text-secondary" />
                                <p className="text-sm font-semibold text-foreground">{demand.metrics.viewCount}</p>
                              </div>
                            </div>

                            {/* Proposals - 1 col */}
                            <div className="p-4 md:p-5 text-center">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Propostas</p>
                              <div className="flex items-center justify-center gap-1">
                                <IconMessageSquare className="h-3 w-3 text-accent" />
                                <p className="text-sm font-semibold text-foreground">{demand.metrics.proposalCount}</p>
                              </div>
                            </div>

                            {/* Conversion Rate - 1 col */}
                            <div className="p-4 md:p-5 text-center">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Conversão</p>
                              <div className="flex items-center justify-center gap-1">
                                {parseFloat(conversionRate) > 5 ? (
                                  <IconTrendingUp className="h-3 w-3 text-success" />
                                ) : (
                                  <IconTrendingDown className="h-3 w-3 text-warning" />
                                )}
                                <p className="text-sm font-semibold text-foreground">{conversionRate}%</p>
                              </div>
                            </div>

                            {/* Spent - 1 col */}
                            <div className="p-4 md:p-5 text-center">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Gasto</p>
                              <p className="text-sm font-semibold text-foreground">€{demand.metrics.visibilitySpent}</p>
                            </div>

                            {/* Action - 1 col */}
                            <div className="p-4 md:p-5 flex items-center justify-center gap-2">
                              <Link
                                href={`/app/family/demands/${demand.id}/boost?package=BASIC`}
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs font-medium text-primary transition-colors flex items-center gap-1"
                              >
                                <IconEuro className="h-3 w-3" />
                                <span className="hidden sm:inline">Boost</span>
                              </Link>
                              <div className="hidden lg:flex">
                                <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
          <div className="max-w-7xl mx-auto space-y-4 py-8">
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
