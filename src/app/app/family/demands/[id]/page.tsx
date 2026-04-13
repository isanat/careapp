'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { BoostVisibilityModal } from '@/components/demands/boost-visibility-modal';
import { getServiceTypeLabel } from '@/lib/service-types';

interface DemandMetrics {
  viewCount: number;
  proposalCount: number;
  conversionRate: number;
  visibilitySpent: number;
  daysActive: number;
}

interface Proposal {
  id: string;
  caregiverName: string;
  caregiverEmail: string;
  experienceYears: number;
  certifications: string[];
  standardHourlyRate: number;
  message: string;
  proposedHourlyRate: number;
  estimatedStartDate: string;
  status: string;
  createdAt: string;
}

interface Demand {
  id: string;
  familyUserId: string;
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
  status: string;
  createdAt: string;
  metrics: DemandMetrics;
}

export default function FamilyDemandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boostSuccess, setBoostSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Check if boost was successful
    if (searchParams.get('boost') === 'success') {
      setBoostSuccess(true);
      // Remove query param
      router.replace(`/app/family/demands/${resolvedParams.id}`);
    }
  }, [searchParams, resolvedParams.id, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch demand details
        const demandRes = await fetch(`/api/demands/${resolvedParams.id}`);
        if (!demandRes.ok) throw new Error('Demanda não encontrada');
        const demandData = await demandRes.json();
        setDemand(demandData);

        // Verify ownership
        if (demandData.familyUserId !== session?.user?.id) {
          throw new Error('Acesso negado');
        }

        // Fetch proposals
        const proposalsRes = await fetch(`/api/demands/${resolvedParams.id}/proposals`);
        if (proposalsRes.ok) {
          const proposalsData = await proposalsRes.json();
          setProposals(proposalsData.proposals || []);
        } else {
          console.error('[FamilyDemand] Proposals fetch failed:', proposalsRes.status, await proposalsRes.text());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar demanda');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id, session?.user?.id, status]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !demand) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl mb-6">
            <div className="text-destructive font-display font-bold text-sm flex-1">
              {error || 'Demanda não encontrada'}
            </div>
          </div>
          <Link href="/app/family/demands" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            ← Voltar
          </Link>
        </div>
      </AppShell>
    );
  }

  const visibilityBadge = demand.visibilityPackage === 'URGENT'
    ? { bg: 'bg-destructive/10', text: 'text-destructive', label: 'URGENTE' }
    : demand.visibilityPackage === 'PREMIUM'
    ? { bg: 'bg-info/10', text: 'text-info', label: 'DESTACADO' }
    : demand.visibilityPackage === 'BASIC'
    ? { bg: 'bg-success/10', text: 'text-success', label: 'VISÍVEL' }
    : { bg: 'bg-muted', text: 'text-muted-foreground', label: 'NORMAL' };

  const getProposalStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'bg-warning/10', text: 'text-warning', label: 'PENDENTE' };
      case 'ACCEPTED':
        return { bg: 'bg-success/10', text: 'text-success', label: 'ACEITE' };
      case 'REJECTED':
        return { bg: 'bg-destructive/10', text: 'text-destructive', label: 'REJEITADO' };
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground', label: status };
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-8">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          {/* Back Button */}
          <Link href="/app/family/demands" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            ← Voltar
          </Link>

          {/* Success Message */}
          {boostSuccess && (
            <div className="flex items-start gap-4 p-5 bg-success/5 border border-success/20 rounded-2xl">
              <div className="flex-1">
                <p className="font-display font-bold text-foreground text-sm">Boost de visibilidade ativado com sucesso!</p>
                <p className="text-xs text-muted-foreground mt-1">Sua demanda agora tem maior visibilidade no marketplace.</p>
              </div>
            </div>
          )}

          {/* Demand Header Card */}
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2 tracking-tighter leading-none">
                  {demand.title}
                </h1>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">📍 {demand.city}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-foreground font-display font-bold">Status: {demand.status}</span>
                </div>
              </div>
              {visibilityBadge && (
                <span className={`px-4 py-2 rounded-lg font-display font-bold text-[10px] uppercase tracking-widest whitespace-nowrap ${visibilityBadge.bg} ${visibilityBadge.text}`}>
                  {visibilityBadge.label}
                </span>
              )}
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-secondary/30 rounded-2xl p-4 text-center">
                <div className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Visualizações
                </div>
                <div className="text-2xl font-display font-black tracking-tighter">
                  {demand.metrics.viewCount}
                </div>
              </div>
              <div className="bg-secondary/30 rounded-2xl p-4 text-center">
                <div className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Propostas
                </div>
                <div className="text-2xl font-display font-black tracking-tighter">
                  {demand.metrics.proposalCount}
                </div>
              </div>
              <div className="bg-secondary/30 rounded-2xl p-4 text-center">
                <div className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Conversão
                </div>
                <div className="text-2xl font-display font-black tracking-tighter">
                  {demand.metrics.conversionRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-secondary/30 rounded-2xl p-4 text-center">
                <div className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Visibilidade
                </div>
                <div className="text-2xl font-display font-black tracking-tighter text-success">
                  €{demand.metrics.visibilitySpent.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Boost Section */}
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-display font-black text-foreground uppercase tracking-tighter mb-1">
                Aumentar Visibilidade
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                Atraia mais cuidadores com boosts (€3-15)
              </p>
            </div>
            <button
              onClick={() => setShowBoostModal(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-display font-bold text-sm uppercase tracking-widest hover:shadow-elevated transition-all whitespace-nowrap"
            >
              Aumentar Visibilidade
            </button>
          </div>

          {/* Demand Details Card */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Descrição
            </h4>
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
              <p className="text-base text-muted-foreground font-medium whitespace-pre-wrap">
                {demand.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Service Types */}
                <div className="space-y-3">
                  <h5 className="text-lg font-display font-bold text-foreground uppercase tracking-tighter">
                    Tipos de Serviço
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {demand.serviceTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-[10px] font-display font-bold rounded-lg uppercase tracking-widest bg-primary/10 text-primary"
                      >
                        {getServiceTypeLabel(type)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-3">
                  <h5 className="text-lg font-display font-bold text-foreground uppercase tracking-tighter">
                    Requisitos
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Experiência
                      </span>
                      <span className="text-sm font-display font-black text-foreground tracking-tighter">
                        {demand.requiredExperienceLevel}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Tipo de Cuidado
                      </span>
                      <span className="text-sm font-display font-black text-foreground tracking-tighter">
                        {demand.careType}
                      </span>
                    </div>
                    {demand.hoursPerWeek && (
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                          Horas/Semana
                        </span>
                        <span className="text-sm font-display font-black text-foreground tracking-tighter">
                          {demand.hoursPerWeek}h
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-2">
                      <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Datas
                      </span>
                      <span className="text-sm font-display font-black text-foreground tracking-tighter">
                        {new Date(demand.desiredStartDate).toLocaleDateString('pt-PT')} • {new Date(demand.desiredEndDate).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Proposals Section */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Propostas Recebidas
            </h4>
            <div className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
              {proposals.length === 0 ? (
                <div className="text-center py-12 px-5 sm:px-7">
                  <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <h4 className="font-display font-bold text-foreground text-lg mb-2">Nenhuma proposta ainda</h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    Aumente a visibilidade para atrair mais cuidadores
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {proposals.map(proposal => {
                    const statusBadge = getProposalStatusBadge(proposal.status);
                    return (
                      <div
                        key={proposal.id}
                        className="p-5 sm:p-7 hover:bg-secondary/30 transition-colors group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-display font-black text-foreground uppercase tracking-tighter mb-1">
                              {proposal.caregiverName}
                            </h4>
                            <p className="text-sm text-muted-foreground font-medium">
                              {proposal.caregiverEmail}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-[10px] font-display font-bold rounded-lg uppercase tracking-widest whitespace-nowrap ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </div>

                        {/* Proposal Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5 pb-5 border-b border-border/50">
                          <div>
                            <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">
                              Experiência
                            </div>
                            <div className="text-lg font-display font-black text-foreground tracking-tighter">
                              {proposal.experienceYears || 0} {proposal.experienceYears === 1 ? 'ano' : 'anos'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">
                              Taxa Horária
                            </div>
                            <div className="text-lg font-display font-black text-primary tracking-tighter">
                              €{proposal.proposedHourlyRate ? (proposal.proposedHourlyRate / 100).toFixed(2) : proposal.standardHourlyRate}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">
                              Início
                            </div>
                            <div className="text-lg font-display font-black text-foreground tracking-tighter">
                              {proposal.estimatedStartDate
                                ? new Date(proposal.estimatedStartDate).toLocaleDateString('pt-PT')
                                : '—'}
                            </div>
                          </div>
                        </div>

                        {/* Proposal Message */}
                        <div className="bg-secondary/50 rounded-2xl p-4 mb-5 border border-border/50">
                          <p className="text-sm text-foreground font-medium">
                            {proposal.message}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button className="flex-1 sm:flex-none bg-success text-primary-foreground px-4 py-3 rounded-2xl font-display font-bold text-sm uppercase tracking-widest hover:shadow-elevated transition-all">
                            Aceitar
                          </button>
                          <button className="flex-1 sm:flex-none bg-secondary text-foreground px-4 py-3 rounded-2xl font-display font-bold text-sm uppercase tracking-widest hover:bg-secondary/80 transition-colors">
                            Rejeitar
                          </button>
                          <button className="flex-1 sm:flex-none bg-info text-primary-foreground px-4 py-3 rounded-2xl font-display font-bold text-sm uppercase tracking-widest hover:shadow-elevated transition-all">
                            Contatar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Boost Modal */}
      {demand && (
        <BoostVisibilityModal
          demandId={demand.id}
          demandTitle={demand.title}
          isOpen={showBoostModal}
          onClose={() => setShowBoostModal(false)}
          onSuccess={() => {
            setShowBoostModal(false);
            setBoostSuccess(true);
          }}
        />
      )}
    </AppShell>
  );
}
