'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/app-shell';
import { BloomSectionHeader, BloomEmpty } from '@/components/bloom';
import { useToast } from "@/hooks/use-toast";
import { getServiceTypeLabel } from '@/lib/service-types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  IconMapPin,
  IconClock,
  IconEye,
  IconMessageSquare,
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

function DemandsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
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
      toast({ title: "Sucesso", description: "Proposta enviada com sucesso!" });
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-10 bg-muted rounded-2xl w-64 animate-pulse" />
          <div className="h-5 bg-muted rounded-xl w-96 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-muted rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <BloomSectionHeader
          title="Marketplace de Demandas"
          desc="Explore oportunidades de trabalho disponíveis e envie suas propostas."
        />
        <span className="px-3 py-1 text-[10px] font-display font-bold rounded-lg uppercase tracking-widest bg-primary/10 text-primary">
          {demands.length} vagas
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-4 p-5 bg-destructive/10 rounded-2xl border border-destructive/20">
          <IconAlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card p-8 rounded-3xl border border-border shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-primary shadow-sm border border-border">
            <IconFilter className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-sm uppercase">Filtros</p>
            <p className="text-[10px] font-display font-medium text-muted-foreground uppercase tracking-widest">Refine sua busca de oportunidades</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">Localidade</label>
            <input
              type="text"
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              placeholder="Ex: Lisboa, Porto, Covilhã..."
              className="w-full h-11 px-4 bg-secondary rounded-xl border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">Tipo de Serviço</label>
            <select
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              className="w-full h-11 px-4 bg-secondary rounded-xl border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
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
      </div>

      {/* Demands Grid */}
      {demands.length === 0 ? (
        <BloomEmpty
          icon={<IconMapPin className="h-8 w-8" />}
          title="Nenhuma demanda encontrada"
          description="Tente ajustar seus filtros para encontrar mais oportunidades"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demands.map(demand => {
            const createdDate = new Date(demand.createdAt);
            const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

            const visibilityBadge = demand.visibilityPackage === 'URGENT'
              ? { label: 'URGENTE', classes: 'bg-destructive/10 text-destructive' }
              : demand.visibilityPackage === 'PREMIUM'
              ? { label: 'DESTACADO', classes: 'bg-primary/10 text-primary' }
              : demand.visibilityPackage === 'BASIC'
              ? { label: 'VISÍVEL', classes: 'bg-success/10 text-success' }
              : null;

            return (
              <div key={demand.id} className="bg-card rounded-3xl p-7 border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all cursor-pointer group flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex-1 min-w-0">
                    <Link href={`/app/demands/${demand.id}`}>
                      <h3 className="text-base font-display font-black text-foreground group-hover:text-primary transition-colors truncate uppercase">{demand.title}</h3>
                    </Link>
                    <div className="flex items-center gap-1 mt-1">
                      <IconMapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest truncate">{demand.city}{demand.postalCode && ` (${demand.postalCode})`}</span>
                    </div>
                  </div>
                  {visibilityBadge && (
                    <span className={`px-3 py-1 text-[9px] font-display font-bold rounded-lg uppercase tracking-widest shrink-0 ${visibilityBadge.classes}`}>
                      {visibilityBadge.label}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="flex-1 mb-5">
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2">{demand.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {demand.serviceTypes.slice(0, 3).map((service, idx) => (
                      <span key={idx} className="text-[9px] font-display font-bold text-muted-foreground border border-border px-2 py-0.5 rounded-lg uppercase tracking-widest">
                        {getServiceTypeLabel(service)}
                      </span>
                    ))}
                    {demand.serviceTypes.length > 3 && (
                      <span className="text-[9px] font-display font-bold text-muted-foreground border border-border px-2 py-0.5 rounded-lg uppercase tracking-widest">
                        +{demand.serviceTypes.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between pt-5 border-t border-border">
                  <div className="flex items-center gap-4">
                    {demand.hoursPerWeek && (
                      <div className="flex items-center gap-1.5">
                        <IconClock className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">{demand.hoursPerWeek}h/sem</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <IconEye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">{demand.viewCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconMessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">{demand.proposalCount}</span>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenProposalWizard(demand.id);
                    }}
                    size="sm"
                    variant="dark"
                  >
                    Propor
                    <IconChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proposal Wizard Modal */}
      {wizard.demandId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-elevated border border-border">
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-black text-foreground uppercase tracking-tighter">Sua Proposta</h2>
                  <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mt-1">Passo {wizard.step} de 3</p>
                </div>
                <button
                  onClick={handleCloseProposalWizard}
                  className="h-9 w-9 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(wizard.step / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step 1 */}
              {wizard.step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display font-bold text-foreground uppercase text-sm">Quem você é?</h3>
                    <p className="text-xs text-muted-foreground mt-1">Compartilhe informações sobre sua experiência e qualificações</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">Sobre você</label>
                    <Textarea
                      value={wizard.aboutYou}
                      onChange={e => setWizard(prev => ({ ...prev, aboutYou: e.target.value }))}
                      placeholder="Ex: Tenho 10 anos de experiência em cuidados domiciliares..."
                      rows={4}
                      className="rounded-xl text-sm resize-none bg-secondary border-border/50"
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{wizard.aboutYou.length}/500</p>
                  </div>
                  <Button
                    onClick={() => setWizard(prev => ({ ...prev, step: 2 }))}
                    disabled={wizard.aboutYou.trim().length === 0}
                    size="lg"
                    className="w-full"
                  >
                    Continuar <IconArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 2 */}
              {wizard.step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display font-bold text-foreground uppercase text-sm">Sua proposta</h3>
                    <p className="text-xs text-muted-foreground mt-1">Por que você é ideal para esta demanda?</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">Mensagem para a família</label>
                      <Textarea
                        value={wizard.message}
                        onChange={e => setWizard(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Descreva por que você é um bom encaixe..."
                        rows={4}
                        className="rounded-xl text-sm resize-none bg-secondary border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">Taxa por hora (€)</label>
                      <Input
                        type="number"
                        value={wizard.expectedRate}
                        onChange={e => setWizard(prev => ({ ...prev, expectedRate: e.target.value }))}
                        placeholder="Ex: 18.50"
                        step="0.50"
                        min="0"
                        className="h-11 rounded-xl bg-secondary border-border/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setWizard(prev => ({ ...prev, step: 1 }))} size="lg" className="h-11 px-4">
                      <IconArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setWizard(prev => ({ ...prev, step: 3 }))}
                      disabled={wizard.message.trim().length === 0 || !wizard.expectedRate}
                      size="lg"
                      className="flex-1"
                    >
                      Revisar <IconArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {wizard.step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display font-bold text-foreground uppercase text-sm">Revisar proposta</h3>
                    <p className="text-xs text-muted-foreground mt-1">Verifique suas informações antes de enviar</p>
                  </div>
                  <div className="space-y-3 bg-secondary rounded-2xl border border-border/50 p-5">
                    <div className="border-b border-border/50 pb-3">
                      <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">Sobre você</p>
                      <p className="text-sm line-clamp-3">{wizard.aboutYou}</p>
                    </div>
                    <div className="border-b border-border/50 pb-3">
                      <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">Mensagem</p>
                      <p className="text-sm line-clamp-3">{wizard.message}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">Taxa horária</p>
                      <p className="text-2xl font-display font-black text-foreground tracking-tighter">€{parseFloat(wizard.expectedRate || '0').toFixed(2)}/h</p>
                    </div>
                  </div>

                  {wizard.error && (
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                      <IconAlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{wizard.error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setWizard(prev => ({ ...prev, step: 2 }))} size="lg" className="h-11 px-4" disabled={wizard.isSubmitting}>
                      <IconArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleSubmitProposal} disabled={wizard.isSubmitting} size="lg" className="flex-1">
                      {wizard.isSubmitting ? (
                        <><IconLoader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</>
                      ) : (
                        <>Enviar Proposta <IconArrowRight className="h-4 w-4 ml-2" /></>
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
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-muted rounded-2xl w-64" />
              <div className="h-64 bg-muted rounded-3xl" />
            </div>
          </div>
        }
      >
        <DemandsContent />
      </Suspense>
    </AppShell>
  );
}
