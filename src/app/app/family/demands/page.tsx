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
import { DemandActionsDropdown } from '@/components/demands/demand-actions-dropdown';
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
    <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2 tracking-tighter leading-none">Suas Demandas</h1>
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

        {/* Analytics Cards - StatBlock Pattern */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {/* Active Demands */}
            <div className="bg-card p-7 rounded-3xl border border-border shadow-card hover:shadow-elevated transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <IconCheck className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                  Ativas
                </div>
                <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
                  {analytics.activeDemands}
                </div>
              </div>
            </div>

            {/* Closed Demands */}
            <div className="bg-card p-7 rounded-3xl border border-border shadow-card hover:shadow-elevated transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <IconCalendar className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                  Fechadas
                </div>
                <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
                  {analytics.closedDemands}
                </div>
              </div>
            </div>

            {/* Total Spent */}
            <div className="bg-card p-7 rounded-3xl border border-border shadow-card hover:shadow-elevated transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <IconEuro className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                  Gasto
                </div>
                <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
                  €{analytics.totalVisibilitySpent.toFixed(0)}
                </div>
              </div>
            </div>

            {/* Avg Proposals */}
            <div className="bg-card p-7 rounded-3xl border border-border shadow-card hover:shadow-elevated transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <IconMessageSquare className="h-6 w-6 text-accent" />
              </div>
              <div>
                <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                  Propostas
                </div>
                <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
                  {analytics.avgProposalsPerDemand.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Avg Views */}
            <div className="bg-card p-7 rounded-3xl border border-border shadow-card hover:shadow-elevated transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <IconEye className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                  Vistas
                </div>
                <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
                  {analytics.avgViewsPerDemand.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Section - Button Group Pattern */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full space-y-6">
          <TabsList className="w-full grid grid-cols-3 h-11 rounded-2xl bg-muted/50 p-1 border border-border/30">
            <TabsTrigger value="ACTIVE" className="rounded-xl text-xs font-display font-bold uppercase tracking-widest data-[state=active]:shadow-sm data-[state=active]:bg-background data-[state=active]:text-foreground transition-all">
              Ativas ({demands.filter(d => d.status === 'ACTIVE').length})
            </TabsTrigger>
            <TabsTrigger value="CLOSED" className="rounded-xl text-xs font-display font-bold uppercase tracking-widest data-[state=active]:shadow-sm data-[state=active]:bg-background data-[state=active]:text-foreground transition-all">
              Fechadas ({demands.filter(d => d.status === 'CLOSED').length})
            </TabsTrigger>
            <TabsTrigger value="PAUSED" className="rounded-xl text-xs font-display font-bold uppercase tracking-widest data-[state=active]:shadow-sm data-[state=active]:bg-background data-[state=active]:text-foreground transition-all">
              Pausadas ({demands.filter(d => d.status === 'PAUSED').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-0">
            {/* Empty State */}
            {demands.length === 0 ? (
              <div className="text-center py-12 px-4 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-5">
                  {statusFilter === 'ACTIVE' && <IconStar className="h-8 w-8 text-muted-foreground" />}
                  {statusFilter === 'CLOSED' && <IconCheck className="h-8 w-8 text-muted-foreground" />}
                  {statusFilter === 'PAUSED' && <IconCalendar className="h-8 w-8 text-muted-foreground" />}
                </div>
                <h4 className="font-display font-bold text-foreground text-lg mb-2">Nenhuma demanda neste status</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  {statusFilter === 'ACTIVE' && 'Crie sua primeira demanda para atrair cuidadores qualificados'}
                  {statusFilter === 'CLOSED' && 'Aqui aparecerão suas demandas concluídas e fechadas'}
                  {statusFilter === 'PAUSED' && 'Você ainda não pausou nenhuma demanda'}
                </p>
                <Button asChild className="rounded-2xl">
                  <Link href="/app/family/demands/new">
                    <IconPlus className="h-4 w-4 mr-2" />
                    Criar Demanda
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {demands.map(demand => {
                  const conversionRate = demand.metrics.conversionRate.toFixed(1);

                  // Visibility package colors and icons
                  const visibilityConfig = {
                    'URGENT': { colorClass: 'bg-destructive/10 text-destructive border-destructive/30', icon: IconAlertCircle, label: 'Urgente' },
                    'PREMIUM': { colorClass: 'bg-primary/10 text-primary border-primary/30', icon: IconStar, label: 'Premium' },
                    'BASIC': { colorClass: 'bg-secondary/10 text-secondary border-secondary/30', icon: IconCheck, label: 'Básico' },
                  };

                  const config = visibilityConfig[demand.visibilityPackage as keyof typeof visibilityConfig] || { colorClass: 'bg-border/10 text-border', icon: undefined, label: '' };
                  const VisibilityIcon = config.icon;

                  return (
                    <Link key={demand.id} href={`/app/family/demands/${demand.id}`} className="group">
                      <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        {/* Left: Title, Description, Badge */}
                        <div className="flex-1 space-y-3 min-w-0">
                          <div className="space-y-2">
                            <h3 className="text-lg font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                              {demand.title}
                            </h3>

                            {/* Visibility Badge & Location */}
                            <div className="flex flex-wrap gap-2 items-center">
                              {VisibilityIcon && (
                                <span className={`text-[9px] font-display font-bold rounded-lg uppercase tracking-widest px-2.5 py-1 border whitespace-nowrap ${config.colorClass}`}>
                                  {config.label}
                                </span>
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

                        {/* Right: Metrics & Actions */}
                        <div className="flex items-center justify-between md:flex-col md:items-end gap-4 md:gap-3 flex-shrink-0">
                          {/* Metrics Row - Compact */}
                          <div className="flex justify-between gap-4 md:justify-end md:w-full">
                            {/* Views */}
                            <div className="flex flex-col items-center gap-1">
                              <IconEye className="h-4 w-4 text-secondary" />
                              <p className="text-sm font-display font-bold text-foreground">{demand.metrics.viewCount}</p>
                              <p className="text-[9px] text-muted-foreground font-display font-bold uppercase tracking-widest">Vistas</p>
                            </div>

                            {/* Proposals */}
                            <div className="flex flex-col items-center gap-1">
                              <IconMessageSquare className="h-4 w-4 text-accent" />
                              <p className="text-sm font-display font-bold text-foreground">{demand.metrics.proposalCount}</p>
                              <p className="text-[9px] text-muted-foreground font-display font-bold uppercase tracking-widest">Propostas</p>
                            </div>

                            {/* Spent */}
                            <div className="flex flex-col items-center gap-1">
                              <IconEuro className="h-4 w-4 text-primary" />
                              <p className="text-sm font-display font-bold text-foreground">€{demand.metrics.visibilitySpent}</p>
                              <p className="text-[9px] text-muted-foreground font-display font-bold uppercase tracking-widest">Investido</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 w-full md:w-auto">
                            <Link
                              href={`/app/family/demands/${demand.id}/boost?package=BASIC`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 md:flex-none"
                            >
                              <Button
                                size="sm"
                                className="w-full md:w-auto rounded-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <IconEuro className="h-3.5 w-3.5 mr-1.5" />
                                <span className="hidden xs:inline">Boost</span>
                              </Button>
                            </Link>
                            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                              <DemandActionsDropdown
                                demandId={demand.id}
                                demandTitle={demand.title}
                                onActionComplete={() => {}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
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
