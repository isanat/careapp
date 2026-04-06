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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Marketplace de Demandas</h1>
            <Badge variant="secondary" className="text-xs">
              {demands.length} demandas
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Explore oportunidades de trabalho disponíveis e envie suas propostas
          </p>
        </div>

        {error && (
          <Card className="border-error/30 bg-error/5 mb-6">
            <CardContent className="pt-6 flex items-center gap-3">
              <IconAlertCircle className="h-5 w-5 text-error shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-error font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconFilter className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Filtrar Demandas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Localidade</label>
                <Input
                  type="text"
                  value={searchCity}
                  onChange={e => setSearchCity(e.target.value)}
                  placeholder="Ex: Lisboa, Porto..."
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo de Serviço</label>
                <select
                  value={selectedService}
                  onChange={e => setSelectedService(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground shadow-xs transition-[color,box-shadow] outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
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

        {/* Demands Grid */}
        {demands.length === 0 ? (
          <Card className="border-border/30">
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <IconMapPin className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-foreground font-medium mb-1">Nenhuma demanda encontrada</p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar seus filtros para encontrar mais oportunidades
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demands.map(demand => {
              const badgeConfig = VISIBILITY_BADGES[demand.visibilityPackage];
              const BadgeIcon = badgeConfig?.icon;
              const createdDate = new Date(demand.createdAt);
              const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <Link key={demand.id} href={`/app/demands/${demand.id}`} className="group">
                  <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:border-primary/30 border-border/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                            {demand.title}
                          </CardTitle>
                        </div>
                        {badgeConfig && (
                          <Badge
                            variant={badgeConfig.variant as any}
                            className="shrink-0 text-[11px] h-5 flex items-center gap-1"
                          >
                            {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                            {badgeConfig.label}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <IconMapPin className="h-3 w-3" />
                        <span className="truncate">{demand.city}</span>
                        {demand.postalCode && <span className="text-muted-foreground">({demand.postalCode})</span>}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {demand.description}
                      </p>

                      {/* Service Types */}
                      <div className="flex flex-wrap gap-1.5">
                        {demand.serviceTypes.slice(0, 2).map((service, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-[10px] font-normal bg-secondary/10 text-secondary-foreground border-secondary/20"
                          >
                            {service.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {demand.serviceTypes.length > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal bg-secondary/10 text-secondary-foreground border-secondary/20"
                          >
                            +{demand.serviceTypes.length - 2}
                          </Badge>
                        )}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                        {demand.hoursPerWeek && (
                          <div className="text-center py-2">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <IconClock className="h-3 w-3 text-primary" />
                              <span className="text-xs font-medium text-foreground">{demand.hoursPerWeek}h</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">por semana</p>
                          </div>
                        )}
                        <div className="text-center py-2">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <IconEye className="h-3 w-3 text-secondary" />
                            <span className="text-xs font-medium text-foreground">{demand.viewCount}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">visualizações</p>
                        </div>
                        <div className="text-center py-2">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <IconMessageSquare className="h-3 w-3 text-accent" />
                            <span className="text-xs font-medium text-foreground">{demand.proposalCount}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">propostas</p>
                        </div>
                        <div className="text-center py-2">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <IconTrendingUp className="h-3 w-3 text-warm" />
                            <span className="text-xs font-medium text-foreground">
                              {daysAgo === 0 ? 'Hoje' : `${daysAgo}d`}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">criada</p>
                        </div>
                      </div>
                    </CardContent>

                    {/* CTA Button */}
                    <div className="px-6 pb-6 pt-3 border-t border-border/30">
                      <Button
                        className="w-full rounded-lg font-medium"
                        variant="default"
                      >
                        Ver Detalhes & Propor
                      </Button>
                    </div>
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
