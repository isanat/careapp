'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  IconMapPin,
  IconClock,
  IconEye,
  IconMessageSquare,
  IconTrendingUp,
  IconAlertCircle,
  IconStar,
  IconCheck,
  IconFilter,
  IconChevronRight,
} from '@/components/icons';

interface Demand {
  id: string;
  title: string;
  description: string;
  serviceTypes: string[];
  city: string;
  postalCode: string;
  requiredExperienceLevel: string;
  careType: string;
  desiredStartDate: string;
  desiredEndDate: string;
  hoursPerWeek: number | null;
  visibilityPackage: string;
  visibilityExpiresAt: string | null;
  createdAt: string;
  viewCount: number;
  proposalCount: number;
}

const VISIBILITY_BADGES: Record<string, { variant: string; icon: any; label: string }> = {
  URGENT: { variant: 'destructive', icon: IconAlertCircle, label: 'URGENTE' },
  PREMIUM: { variant: 'default', icon: IconStar, label: 'DESTACADO' },
  BASIC: { variant: 'secondary', icon: IconCheck, label: 'VISÍVEL' },
  NONE: { variant: 'outline', icon: undefined, label: 'NORMAL' },
};

export default function DemandsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState('');
  const [selectedService, setSelectedService] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchDemands = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = '/api/demands?limit=50';
        if (searchCity) {
          url += `&city=${encodeURIComponent(searchCity)}`;
        }
        if (selectedService) {
          url += `&serviceType=${encodeURIComponent(selectedService)}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch demands');
        const data = await res.json();
        setDemands(data.demands);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchDemands, 300);
    return () => clearTimeout(debounceTimer);
  }, [status, searchCity, selectedService]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Marketplace de Demandas</h1>
            <Badge variant="secondary" className="text-xs font-medium">
              {demands.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Explore oportunidades de trabalho disponíveis na plataforma e envie suas propostas aos familiares
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <IconAlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <Card className="border-border/40">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <IconFilter className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Filtros</CardTitle>
                <CardDescription className="text-xs mt-0.5">Refine sua busca de oportunidades</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Localidade</label>
                <Input
                  type="text"
                  value={searchCity}
                  onChange={e => setSearchCity(e.target.value)}
                  placeholder="Ex: Lisboa, Porto, Covilhã..."
                  className="h-10 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Tipo de Serviço</label>
                <select
                  value={selectedService}
                  onChange={e => setSelectedService(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground shadow-xs transition-[color,box-shadow] outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
                >
                  <option value="">Todos os serviços</option>
                  <option value="PERSONAL_CARE">Cuidados Pessoais</option>
                  <option value="MEDICATION">Medicação</option>
                  <option value="MOBILITY">Mobilidade</option>
                  <option value="COMPANIONSHIP">Companhia</option>
                  <option value="MEAL_PREPARATION">Refeições</option>
                  <option value="LIGHT_HOUSEWORK">Tarefas Domésticas</option>
                  <option value="TRANSPORTATION">Transporte</option>
                  <option value="COGNITIVE_SUPPORT">Estimulação Cognitiva</option>
                  <option value="NIGHT_CARE">Cuidados Noturnos</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demands List */}
        {demands.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border/40 py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center mb-3 mx-auto">
              <IconMapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold mb-1">Nenhuma demanda encontrada</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Tente ajustar seus filtros para encontrar mais oportunidades de trabalho
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {demands.map(demand => {
              const badgeConfig = VISIBILITY_BADGES[demand.visibilityPackage];
              const BadgeIcon = badgeConfig?.icon;
              const createdDate = new Date(demand.createdAt);
              const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <Link key={demand.id} href={`/app/demands/${demand.id}`} className="group block">
                  <Card className="border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row gap-0 divide-y md:divide-y-0 md:divide-x md:divide-border/30">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0 p-4 md:p-5 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3 min-w-0">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                {demand.title}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <IconMapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{demand.city}</span>
                                {demand.postalCode && (
                                  <span className="text-muted-foreground shrink-0">({demand.postalCode})</span>
                                )}
                              </div>
                            </div>
                            {badgeConfig && (
                              <Badge
                                variant={badgeConfig.variant as any}
                                className="shrink-0 text-[11px] h-5 flex items-center gap-1 px-2"
                              >
                                {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                                {badgeConfig.label}
                              </Badge>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {demand.description}
                          </p>

                          {/* Service Types */}
                          <div className="flex flex-wrap gap-1.5">
                            {demand.serviceTypes.slice(0, 2).map((service, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[10px] font-medium px-2 py-0.5 h-auto bg-secondary/10 text-secondary-foreground border-secondary/20"
                              >
                                {service.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                            {demand.serviceTypes.length > 2 && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-medium px-2 py-0.5 h-auto bg-secondary/10 text-secondary-foreground border-secondary/20"
                              >
                                +{demand.serviceTypes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Stats & Action */}
                        <div className="px-4 md:px-5 py-4 md:py-5 md:w-60 flex items-center justify-between md:flex-col gap-4 md:gap-3">
                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2.5 flex-1 md:w-full">
                            {demand.hoursPerWeek && (
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <IconClock className="h-3 w-3 text-primary" />
                                </div>
                                <p className="text-xs font-semibold text-foreground">{demand.hoursPerWeek}h</p>
                                <p className="text-[10px] text-muted-foreground">semana</p>
                              </div>
                            )}
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <IconEye className="h-3 w-3 text-secondary" />
                              </div>
                              <p className="text-xs font-semibold text-foreground">{demand.viewCount}</p>
                              <p className="text-[10px] text-muted-foreground">vistas</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <IconMessageSquare className="h-3 w-3 text-accent" />
                              </div>
                              <p className="text-xs font-semibold text-foreground">{demand.proposalCount}</p>
                              <p className="text-[10px] text-muted-foreground">propostas</p>
                            </div>
                          </div>

                          {/* CTA Button */}
                          <Button size="sm" className="w-full md:w-full h-9 text-xs rounded-lg gap-1 group/btn">
                            <span>Propor</span>
                            <IconChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
