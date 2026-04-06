'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

export default function FamilyDemandsPage() {
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
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-primary">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium">Carregando demandas...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="border-error/30 bg-error/5">
            <CardContent className="pt-6 flex items-center gap-3">
              <IconAlertCircle className="h-5 w-5 text-error shrink-0" />
              <p className="text-sm text-error font-medium">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-foreground">Suas Demandas</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie e acompanhe todas as suas demandas de serviços
              </p>
            </div>
            <Button asChild className="rounded-lg">
              <Link href="/app/family/demands/new">
                <IconPlus className="h-4 w-4 mr-2" />
                Criar Demanda
              </Link>
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="border-border/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Demandas Ativas</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.activeDemands}</p>
                  </div>
                  <IconCheck className="h-8 w-8 text-success opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Demandas Fechadas</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.closedDemands}</p>
                  </div>
                  <IconCalendar className="h-8 w-8 text-secondary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Gasto em Visibilidade</p>
                    <p className="text-2xl font-bold text-foreground">€{analytics.totalVisibilitySpent.toFixed(2)}</p>
                  </div>
                  <IconEuro className="h-8 w-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Propostas/Demanda</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.avgProposalsPerDemand.toFixed(1)}</p>
                  </div>
                  <IconMessageSquare className="h-8 w-8 text-accent opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Views/Demanda</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.avgViewsPerDemand.toFixed(1)}</p>
                  </div>
                  <IconEye className="h-8 w-8 text-warm opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-9 rounded-lg bg-muted p-0.5 mb-6">
            <TabsTrigger value="ACTIVE" className="rounded-md text-xs data-[state=active]:shadow-sm">
              Ativas ({demands.filter(d => d.status === 'ACTIVE').length})
            </TabsTrigger>
            <TabsTrigger value="CLOSED" className="rounded-md text-xs data-[state=active]:shadow-sm">
              Fechadas ({demands.filter(d => d.status === 'CLOSED').length})
            </TabsTrigger>
            <TabsTrigger value="PAUSED" className="rounded-md text-xs data-[state=active]:shadow-sm">
              Em Pausa ({demands.filter(d => d.status === 'PAUSED').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter}>
            {/* Demands Grid */}
            {demands.length === 0 ? (
              <Card className="border-border/30">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="mb-3">
                    {statusFilter === 'ACTIVE' && <IconStar className="h-8 w-8 text-muted-foreground mx-auto" />}
                    {statusFilter === 'CLOSED' && <IconCheck className="h-8 w-8 text-muted-foreground mx-auto" />}
                    {statusFilter === 'PAUSED' && <IconCalendar className="h-8 w-8 text-muted-foreground mx-auto" />}
                  </div>
                  <p className="text-foreground font-medium mb-1">Nenhuma demanda neste status</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {statusFilter === 'ACTIVE' && 'Crie sua primeira demanda para atrair cuidadores'}
                    {statusFilter === 'CLOSED' && 'Aqui aparecerão suas demandas concluídas'}
                    {statusFilter === 'PAUSED' && 'Você ainda não pausou nenhuma demanda'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
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
                    <Link key={demand.id} href={`/app/family/demands/${demand.id}`} className="block group">
                      <Card className="border-border/30 transition-all hover:shadow-md hover:border-primary/30">
                        <CardContent className="py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-3 items-center">
                            {/* Title & Description */}
                            <div className="lg:col-span-2 min-w-0">
                              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {demand.title}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {demand.description}
                              </p>
                            </div>

                            {/* Location */}
                            <div className="hidden md:block">
                              <p className="text-xs text-muted-foreground font-medium mb-0.5">Localidade</p>
                              <p className="text-sm text-foreground truncate">{demand.city}</p>
                            </div>

                            {/* Visibility Package */}
                            <div>
                              <p className="text-xs text-muted-foreground font-medium mb-1">Visibilidade</p>
                              <Badge
                                variant={visibilityBadgeVariant as any}
                                className="text-[10px] h-5 flex items-center justify-center gap-1 w-fit"
                              >
                                {VisibilityIcon && <VisibilityIcon className="h-3 w-3" />}
                                {demand.visibilityPackage || 'Nenhum'}
                              </Badge>
                            </div>

                            {/* Views */}
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground font-medium mb-0.5">Views</p>
                              <div className="flex items-center justify-center gap-1">
                                <IconEye className="h-3 w-3 text-secondary" />
                                <p className="text-sm font-bold text-foreground">{demand.metrics.viewCount}</p>
                              </div>
                            </div>

                            {/* Proposals */}
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground font-medium mb-0.5">Propostas</p>
                              <div className="flex items-center justify-center gap-1">
                                <IconMessageSquare className="h-3 w-3 text-accent" />
                                <p className="text-sm font-bold text-foreground">{demand.metrics.proposalCount}</p>
                              </div>
                            </div>

                            {/* Conversion Rate */}
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground font-medium mb-0.5">Conversão</p>
                              <div className="flex items-center justify-center gap-1">
                                {parseFloat(conversionRate) > 5 ? (
                                  <IconTrendingUp className="h-3 w-3 text-success" />
                                ) : (
                                  <IconTrendingDown className="h-3 w-3 text-warning" />
                                )}
                                <p className="text-sm font-bold text-foreground">{conversionRate}%</p>
                              </div>
                            </div>

                            {/* Spent */}
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground font-medium mb-0.5">Gasto</p>
                              <p className="text-sm font-bold text-foreground">€{demand.metrics.visibilitySpent}</p>
                            </div>

                            {/* Action */}
                            <div className="flex justify-end">
                              <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
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
    </div>
  );
}
