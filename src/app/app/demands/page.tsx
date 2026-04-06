'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AppShell } from '@/components/layout/app-shell';
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
  IconArrowLeft,
  IconArrowRight,
  IconLoader2,
  IconX,
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
  familyName?: string;
  familyAvatar?: string;
}

interface ProposalWizardState {
  demandId: string | null;
  step: number;
  message: string;
  expectedRate: string;
  aboutYou: string;
  isSubmitting: boolean;
  error: string | null;
}

const VISIBILITY_BADGES: Record<string, { variant: string; icon: any; label: string }> = {
  URGENT: { variant: 'destructive', icon: IconAlertCircle, label: 'URGENTE' },
  PREMIUM: { variant: 'default', icon: IconStar, label: 'DESTACADO' },
  BASIC: { variant: 'secondary', icon: IconCheck, label: 'VISÍVEL' },
  NONE: { variant: 'outline', icon: undefined, label: 'NORMAL' },
};

function DemandsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [wizard, setWizard] = useState<ProposalWizardState>({
    demandId: null,
    step: 1,
    message: '',
    expectedRate: '',
    aboutYou: '',
    isSubmitting: false,
    error: null,
  });

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

  const handleOpenProposalWizard = (demandId: string) => {
    setWizard({
      demandId,
      step: 1,
      message: '',
      expectedRate: '',
      aboutYou: '',
      isSubmitting: false,
      error: null,
    });
  };

  const handleCloseProposalWizard = () => {
    setWizard({
      demandId: null,
      step: 1,
      message: '',
      expectedRate: '',
      aboutYou: '',
      isSubmitting: false,
      error: null,
    });
  };

  const handleSubmitProposal = async () => {
    if (!wizard.demandId) return;
    setWizard(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandId: wizard.demandId,
          message: wizard.message,
          expectedRate: wizard.expectedRate ? parseFloat(wizard.expectedRate) : undefined,
          aboutYou: wizard.aboutYou,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao enviar proposta');
      }

      handleCloseProposalWizard();
      // Show success message (could use toast)
      alert('Proposta enviada com sucesso!');
    } catch (err) {
      setWizard(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erro inesperado',
        isSubmitting: false,
      }));
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              handleOpenProposalWizard(demand.id);
                            }}
                            size="sm"
                            className="w-full md:w-full h-9 text-xs rounded-lg gap-1 group/btn"
                          >
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

      {/* Proposal Wizard Modal - Improved styling */}
      {wizard.demandId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-background rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Proposal Wizard */}
            <div className="p-6 space-y-5">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Sua Proposta</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Passo {wizard.step} de 3
                  </p>
                </div>
                <button
                  onClick={handleCloseProposalWizard}
                  className="h-9 w-9 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  aria-label="Fechar"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Passo {wizard.step} de 3
                  </span>
                  <span className="text-xs text-muted-foreground">{Math.round((wizard.step / 3) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(wizard.step / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step 1: Caregiver Info Summary */}
              {wizard.step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold mb-1">Quem você é?</h3>
                    <p className="text-xs text-muted-foreground">
                      Compartilhe informações sobre sua experiência e qualificações
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Sobre você (experiência, certificações)</Label>
                      <Textarea
                        value={wizard.aboutYou}
                        onChange={e => setWizard(prev => ({ ...prev, aboutYou: e.target.value }))}
                        placeholder="Ex: Tenho 10 anos de experiência em cuidados domiciliares, certificado em primeiros socorros..."
                        rows={4}
                        className="rounded-xl text-sm resize-none"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {wizard.aboutYou.length}/500
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setWizard(prev => ({ ...prev, step: 2 }))}
                    disabled={wizard.aboutYou.trim().length === 0}
                    size="lg"
                    className="w-full h-11 rounded-xl font-semibold gap-2"
                  >
                    Continuar
                    <IconArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step 2: Proposal Message */}
              {wizard.step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold mb-1">Sua proposta</h3>
                    <p className="text-xs text-muted-foreground">
                      Por que você é ideal para esta demanda?
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Mensagem para a família</Label>
                      <Textarea
                        value={wizard.message}
                        onChange={e => setWizard(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Descreva por que você é um bom encaixe para esta demanda e o que pode oferecer..."
                        rows={4}
                        className="rounded-xl text-sm resize-none"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {wizard.message.length}/1000
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Sua taxa por hora (€)</Label>
                      <Input
                        type="number"
                        value={wizard.expectedRate}
                        onChange={e => setWizard(prev => ({ ...prev, expectedRate: e.target.value }))}
                        placeholder="Ex: 18.50"
                        step="0.50"
                        min="0"
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setWizard(prev => ({ ...prev, step: 1 }))}
                      size="lg"
                      className="h-11 rounded-xl px-4"
                    >
                      <IconArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setWizard(prev => ({ ...prev, step: 3 }))}
                      disabled={wizard.message.trim().length === 0 || !wizard.expectedRate}
                      size="lg"
                      className="flex-1 h-11 rounded-xl font-semibold gap-2"
                    >
                      Revisar
                      <IconArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {wizard.step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold mb-1">Revisar proposta</h3>
                    <p className="text-xs text-muted-foreground">
                      Verifique suas informações antes de enviar
                    </p>
                  </div>

                  <div className="space-y-3 bg-surface rounded-xl border border-border/50 p-4">
                    <div className="border-b border-border/50 pb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Sobre você
                      </p>
                      <p className="text-sm line-clamp-3">{wizard.aboutYou}</p>
                    </div>

                    <div className="border-b border-border/50 pb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Mensagem
                      </p>
                      <p className="text-sm line-clamp-3">{wizard.message}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Taxa horária
                      </p>
                      <p className="text-lg font-bold">€{parseFloat(wizard.expectedRate || '0').toFixed(2)}/h</p>
                    </div>
                  </div>

                  {wizard.error && (
                    <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl">
                      <IconAlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{wizard.error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setWizard(prev => ({ ...prev, step: 2 }))}
                      size="lg"
                      className="h-11 rounded-xl px-4"
                      disabled={wizard.isSubmitting}
                    >
                      <IconArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSubmitProposal}
                      disabled={wizard.isSubmitting}
                      size="lg"
                      className="flex-1 h-11 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/25"
                    >
                      {wizard.isSubmitting ? (
                        <>
                          <IconLoader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar Proposta
                          <IconArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DemandsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="max-w-lg mx-auto space-y-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-muted rounded-2xl" />
              <div className="h-64 bg-muted rounded-2xl" />
            </div>
          </div>
        }
      >
        <DemandsContent />
      </Suspense>
    </AppShell>
  );
}
