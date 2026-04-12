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
        <div className="max-w-2xl mx-auto py-8 space-y-4">
          <div className="bg-surface rounded-2xl border-2 border-destructive/30 p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            </div>
          </div>
          <Link href="/app/demands" className="text-primary hover:text-primary/80 font-medium inline-block mt-4">
            ← Voltar às demandas
          </Link>
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
      <div className="max-w-4xl mx-auto pb-8 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/app/demands" className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1">
            ← Voltar
          </Link>
        </div>

        {/* Header Card */}
        <div className="bg-surface rounded-2xl border-2 border-primary/20">
          <div className="h-1 -mx-[2px] -mt-[2px] rounded-t-lg bg-primary" />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-foreground mb-2">{demand.title}</h1>
                <p className="text-muted-foreground">
                  👤 Família em <span className="font-semibold text-foreground">{demand.familyCity}</span> | 📍 {demand.city}
                  {demand.postalCode && ` (${demand.postalCode})`}
                </p>
              </div>
              {badge && (
                <span className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${badge.bg} ${badge.text} text-sm flex-shrink-0`}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-surface rounded-xl border-2 border-border/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Visualizações</p>
            <p className="text-2xl font-bold text-foreground">{demand.metrics.viewCount}</p>
          </div>
          <div className="bg-surface rounded-xl border-2 border-border/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Propostas</p>
            <p className="text-2xl font-bold text-foreground">{demand.metrics.proposalCount}</p>
          </div>
          <div className="bg-surface rounded-xl border-2 border-border/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Taxa Conversão</p>
            <p className="text-2xl font-bold text-foreground">{demand.metrics.conversionRate.toFixed(1)}%</p>
          </div>
          <div className="bg-surface rounded-xl border-2 border-border/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Criada há</p>
            <p className="text-2xl font-bold text-foreground">{demand.metrics.daysActive} dias</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-5">
          {/* Description */}
          <div className="bg-surface rounded-2xl border-2 border-border/30 p-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Descrição Detalhada</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{demand.description}</p>
          </div>

          {/* Service Types */}
          <div className="bg-surface rounded-2xl border-2 border-border/30 p-6">
            <h3 className="text-lg font-bold text-foreground mb-3">Tipos de Serviço</h3>
            <div className="flex flex-wrap gap-2">
              {demand.serviceTypes.map((service, idx) => (
                <span key={idx} className="bg-secondary/20 text-secondary px-3 py-1.5 rounded-lg text-xs font-medium border border-secondary/30">
                  {getServiceTypeLabel(service)}
                </span>
              ))}
            </div>
          </div>

          {/* Requirements and Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Requirements */}
            <div className="bg-surface rounded-2xl border-2 border-border/30 p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Requisitos</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Nível de Experiência</p>
                  <p className="text-sm text-foreground">{demand.requiredExperienceLevel}</p>
                </div>
                {demand.requiredCertifications.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Certificações</p>
                    <div className="space-y-1">
                      {demand.requiredCertifications.map((cert, idx) => (
                        <div key={idx} className="text-sm text-foreground bg-muted/20 rounded px-2.5 py-1.5">• {cert}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Tipo de Cuidado</p>
                  <p className="text-sm text-foreground">{demand.careType}</p>
                </div>
              </div>
            </div>

            {/* Practical Details */}
            <div className="bg-surface rounded-2xl border-2 border-border/30 p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Detalhes Práticos</h3>
              <div className="space-y-3">
                {demand.hoursPerWeek && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Horas/Semana</p>
                    <p className="text-sm font-medium text-foreground">{demand.hoursPerWeek}h</p>
                  </div>
                )}
                {demand.desiredStartDate && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Data de Início</p>
                    <p className="text-sm text-foreground">{new Date(demand.desiredStartDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                )}
                {demand.desiredEndDate && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Data de Término</p>
                    <p className="text-sm text-foreground">{new Date(demand.desiredEndDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Endereço</p>
                  <p className="text-sm text-foreground">{demand.address || 'Não especificado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-surface rounded-2xl border-2 border-destructive/30 p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            </div>
          )}

          {/* Proposal Form */}
          <div className="bg-surface rounded-2xl border-2 border-primary/20 p-6">
            <div className="h-1 -mx-6 -mt-6 mb-6 rounded-t-lg bg-primary" />
            <h2 className="text-lg font-bold text-foreground mb-4">Enviar Proposta</h2>

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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
