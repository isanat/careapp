'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getServiceTypeLabel } from '@/lib/service-types';
import { BloomCard, BloomBadge, BloomSectionHeader, BloomEmpty } from '@/components/bloom';
import { IconAlertCircle, IconArrowLeft } from '@/components/icons';

interface Demand {
  id: string;
  familyName: string;
  familyCity: string;
  title: string;
  description: string;
  serviceTypes: string[];
  address: string;
  city: string;
  postalCode: string;
  requiredExperienceLevel: string;
  requiredCertifications: string[];
  careType: string;
  desiredStartDate: string;
  desiredEndDate: string;
  hoursPerWeek: number;
  visibilityPackage: string;
  visibilityExpiresAt: string;
  createdAt: string;
  metrics: {
    viewCount: number;
    proposalCount: number;
    conversionRate: number;
    visibilitySpent: number;
    daysActive: number;
  };
}

export default function DemandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposing, setProposing] = useState(false);
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposedHourlyRate, setProposedHourlyRate] = useState('');
  const [estimatedStartDate, setEstimatedStartDate] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !resolvedParams.id) return;

    const fetchDemand = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/demands/${resolvedParams.id}`);
        if (!res.ok) throw new Error('Demanda não encontrada');
        const data = await res.json();
        setDemand(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar demanda');
      } finally {
        setLoading(false);
      }
    };

    fetchDemand();
  }, [resolvedParams.id, status]);

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resolvedParams.id) {
      setError('ID da demanda não encontrado');
      return;
    }

    if (!proposalMessage.trim()) {
      setError('Mensagem é obrigatória');
      return;
    }

    if (proposalMessage.length < 20) {
      setError('Mensagem deve ter pelo menos 20 caracteres');
      return;
    }

    try {
      setProposing(true);

      const res = await fetch(`/api/demands/${resolvedParams.id}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: proposalMessage,
          proposedHourlyRate: proposedHourlyRate ? parseInt(proposedHourlyRate) * 100 : undefined,
          estimatedStartDate: estimatedStartDate || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao enviar proposta');
      }

      const data = await res.json();
      toast({
        title: "✓ Proposta Enviada",
        description: data.message || "A família foi notificada sobre sua proposta!"
      });
      setProposalMessage('');
      setProposedHourlyRate('');
      setEstimatedStartDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar proposta');
    } finally {
      setProposing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
  }

  if (error && !demand) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-4">
          <Link href="/app/demands" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
            <IconArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <BloomCard topBar topBarColor="bg-destructive">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <IconAlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-destructive mb-1">Erro ao carregar demanda</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </BloomCard>
        </div>
      </AppShell>
    );
  }

  if (!demand) return null;

  const badge = demand.visibilityPackage === 'URGENT'
    ? { bg: 'bg-destructive/10', text: 'text-destructive', label: '🔴 URGENTE' }
    : demand.visibilityPackage === 'PREMIUM'
    ? { bg: 'bg-primary/10', text: 'text-primary', label: '⭐ DESTACADO' }
    : demand.visibilityPackage === 'BASIC'
    ? { bg: 'bg-success/10', text: 'text-success', label: '✓ VISÍVEL' }
    : { bg: 'bg-muted/10', text: 'text-muted-foreground', label: 'NORMAL' };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-8 space-y-6">
        <Link href="/app/demands" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
          <IconArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        {/* Header Card - Bloom style */}
        <BloomCard topBar>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-display font-black text-foreground uppercase mb-3">{demand.title}</h1>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{demand.familyCity}</span> • {demand.city}
                  {demand.postalCode && ` (${demand.postalCode})`}
                </p>
                <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">
                  Criada há {demand.metrics.daysActive} dias
                </p>
              </div>
            </div>
            {badge && (
              <BloomBadge variant={
                demand.visibilityPackage === 'URGENT' ? 'destructive' :
                demand.visibilityPackage === 'PREMIUM' ? 'primary' :
                demand.visibilityPackage === 'BASIC' ? 'success' :
                'muted'
              } className="flex-shrink-0">
                {badge.label.replace('🔴 ', '').replace('⭐ ', '').replace('✓ ', '')}
              </BloomBadge>
            )}
          </div>
        </BloomCard>

        {/* Metrics Cards - Bloom pattern */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <BloomCard interactive>
            <div className="text-center">
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">Visualizações</p>
              <p className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tighter">{demand.metrics.viewCount}</p>
            </div>
          </BloomCard>
          <BloomCard interactive>
            <div className="text-center">
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">Propostas</p>
              <p className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tighter">{demand.metrics.proposalCount}</p>
            </div>
          </BloomCard>
          <BloomCard interactive>
            <div className="text-center">
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">Taxa Conversão</p>
              <p className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tighter">{demand.metrics.conversionRate.toFixed(1)}%</p>
            </div>
          </BloomCard>
          <BloomCard interactive>
            <div className="text-center">
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">Taxa Spent</p>
              <p className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tighter">€{demand.metrics.visibilitySpent.toFixed(2)}</p>
            </div>
          </BloomCard>
        </div>

        {/* Main Content - Bloom Style */}
        <div className="space-y-6">
          {/* Description */}
          <BloomCard topBar>
            <h2 className="text-lg font-display font-black text-foreground uppercase mb-4">Descrição</h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{demand.description}</p>
          </BloomCard>

          {/* Service Types */}
          <BloomCard topBar topBarColor="bg-secondary">
            <h3 className="text-lg font-display font-black text-foreground uppercase mb-4">Tipos de Serviço</h3>
            <div className="flex flex-wrap gap-2">
              {demand.serviceTypes.map((service, idx) => (
                <BloomBadge key={idx} variant="secondary">
                  {getServiceTypeLabel(service)}
                </BloomBadge>
              ))}
            </div>
          </BloomCard>

          {/* Requirements and Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Requirements */}
            <BloomCard topBar topBarColor="bg-info">
              <h3 className="text-lg font-display font-black text-foreground uppercase mb-4">Requisitos</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Nível de Experiência</p>
                  <p className="text-sm font-medium text-foreground">{demand.requiredExperienceLevel}</p>
                </div>
                {demand.requiredCertifications.length > 0 && (
                  <div>
                    <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">Certificações</p>
                    <div className="space-y-2">
                      {demand.requiredCertifications.map((cert, idx) => (
                        <div key={idx} className="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2">• {cert}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Tipo de Cuidado</p>
                  <p className="text-sm font-medium text-foreground">{demand.careType}</p>
                </div>
              </div>
            </BloomCard>

            {/* Practical Details */}
            <BloomCard topBar>
              <h3 className="text-lg font-display font-black text-foreground uppercase mb-4">Detalhes Práticos</h3>
              <div className="space-y-4">
                {demand.hoursPerWeek && (
                  <div>
                    <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Horas/Semana</p>
                    <p className="text-sm font-semibold text-foreground">{demand.hoursPerWeek}h</p>
                  </div>
                )}
                {demand.desiredStartDate && (
                  <div>
                    <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Data de Início</p>
                    <p className="text-sm text-foreground">{new Date(demand.desiredStartDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                )}
                {demand.desiredEndDate && (
                  <div>
                    <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Data de Término</p>
                    <p className="text-sm text-foreground">{new Date(demand.desiredEndDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                )}
                <div>
                  <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Endereço</p>
                  <p className="text-sm text-foreground">{demand.address || 'Não especificado'}</p>
                </div>
              </div>
            </BloomCard>
          </div>

          {/* Error Message */}
          {error && (
            <BloomCard topBar topBarColor="bg-destructive">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <IconAlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold text-destructive mb-1">Erro</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            </BloomCard>
          )}

          {/* Proposal Form - Bloom style */}
          <BloomCard topBar>
            <h2 className="text-lg font-display font-black text-foreground uppercase mb-6">Enviar Proposta</h2>

            <form onSubmit={handleSendProposal} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Sua Mensagem <span className="text-destructive">*</span> (mín. 20 caracteres)
                </label>
                <textarea
                  value={proposalMessage}
                  onChange={e => setProposalMessage(e.target.value)}
                  placeholder="Apresente-se brevemente, descreva sua experiência, e por que é a pessoa certa para o trabalho..."
                  rows={5}
                  className="w-full px-4 py-3 bg-background border-2 border-border/30 rounded-xl focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground text-sm"
                />
                <div className="text-xs text-muted-foreground mt-2">
                  {proposalMessage.length}/20 caracteres mínimos
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Taxa Horária Proposta (€/hora)
                  </label>
                  <input
                    type="number"
                    value={proposedHourlyRate}
                    onChange={e => setProposedHourlyRate(e.target.value)}
                    min="0"
                    step="0.50"
                    placeholder="Ex: 12.50"
                    className="w-full px-4 py-3 bg-background border-2 border-border/30 rounded-xl focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Data de Início Estimada
                  </label>
                  <input
                    type="date"
                    value={estimatedStartDate}
                    onChange={e => setEstimatedStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-background border-2 border-border/30 rounded-xl focus:border-primary focus:outline-none text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={proposing}
                  className="flex-1 h-12 text-base font-semibold rounded-xl"
                >
                  {proposing ? 'Enviando...' : 'Enviar Proposta'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/app/demands')}
                  className="flex-1 h-12 text-base font-semibold rounded-xl"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </BloomCard>
        </div>
      </div>
    </AppShell>
  );
}
