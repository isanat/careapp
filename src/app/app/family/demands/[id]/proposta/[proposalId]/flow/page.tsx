'use client';

import React, { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  IconArrowLeft,
  IconArrowRight,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconMessageSquare,
  IconVideo,
  IconCalendar,
  IconClock,
  IconUser,
  IconStar,
  IconFileText,
  IconInfo,
} from '@/components/icons';

interface ProposalData {
  id: string;
  caregiverId: string;
  caregiver: {
    name: string;
    title: string;
    averageRating: number;
    hourlyRateEur: number;
  };
  demandId: string;
  message: string;
  expectedRate: number;
  aboutYou: string;
  status: string;
  createdAt: string;
}

interface FlowState {
  chatMessage: string;
  interviewDate: string;
  interviewTime: string;
  interviewNotes: string;
  agreedTerms: boolean;
  isSubmitting: boolean;
}

function ProposalFlowContent() {
  const params = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const demandId = params?.id as string;
  const proposalId = params?.proposalId as string;

  const [step, setStep] = useState(1);
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [flowState, setFlowState] = useState<FlowState>({
    chatMessage: '',
    interviewDate: '',
    interviewTime: '',
    interviewNotes: '',
    agreedTerms: false,
    isSubmitting: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !proposalId) return;

    const fetchProposal = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/proposals/${proposalId}`);
        if (!res.ok) throw new Error('Proposta não encontrada');
        const data = await res.json();
        setProposal(data.proposal);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar proposta');
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [status, proposalId]);

  const handleSendMessage = async () => {
    if (!flowState.chatMessage.trim() || !proposalId) return;
    setFlowState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const res = await fetch(`/api/proposals/${proposalId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: flowState.chatMessage }),
      });

      if (!res.ok) throw new Error('Erro ao enviar mensagem');

      setFlowState(prev => ({ ...prev, chatMessage: '', isSubmitting: false }));
      setStep(2);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro inesperado');
      setFlowState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleScheduleInterview = async () => {
    if (!flowState.interviewDate || !flowState.interviewTime || !proposalId) {
      setSubmitError('Data e hora são obrigatórias');
      return;
    }

    setFlowState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const res = await fetch(`/api/proposals/${proposalId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewDate: flowState.interviewDate,
          interviewTime: flowState.interviewTime,
          notes: flowState.interviewNotes,
        }),
      });

      if (!res.ok) throw new Error('Erro ao agendar entrevista');

      setFlowState(prev => ({ ...prev, isSubmitting: false }));
      setStep(3);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro inesperado');
      setFlowState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleApproveProposal = async () => {
    if (!flowState.agreedTerms || !proposalId) {
      setSubmitError('Você deve concordar com os termos');
      return;
    }

    setFlowState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const res = await fetch(`/api/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Erro ao aprovar proposta');

      setFlowState(prev => ({ ...prev, isSubmitting: false }));
      setStep(4);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro inesperado');
      setFlowState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleCreateContract = async () => {
    if (!proposalId || !demandId) return;

    setFlowState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const res = await fetch('/api/contracts/from-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          demandId,
        }),
      });

      if (!res.ok) throw new Error('Erro ao criar contrato');

      const data = await res.json();
      setStep(5);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro inesperado');
      setFlowState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-96 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 flex items-start gap-4">
          <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-destructive">{error || 'Proposta não encontrada'}</p>
            <Button asChild className="mt-4 h-10 rounded-xl text-sm">
              <Link href={`/app/family/demands/${demandId}`}>Voltar para Demanda</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;
  const caregiver = proposal.caregiver;

  return (
    <div className="max-w-2xl mx-auto pb-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2 tracking-tighter leading-none">
            Fluxo de Proposta
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Finalize a proposta do cuidador
          </p>
        </div>
        <Link
          href={`/app/family/demands/${demandId}`}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors flex-shrink-0 mt-1"
          aria-label="Fechar"
        >
          <IconX className="h-5 w-5" />
        </Link>
      </div>

      {/* Progress Stepper */}
      <div>
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {[1, 2, 3, 4, 5].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display font-bold transition-all ${
                  stepNum < step
                    ? 'bg-success text-success-foreground'
                    : stepNum === step
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-muted-foreground border border-border'
                }`}>
                  {stepNum < step ? '✓' : stepNum}
                </div>
              </div>
              {stepNum < 5 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${stepNum < step ? 'bg-success' : 'bg-border'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Caregiver Info Card */}
      <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card overflow-hidden">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 rounded-2xl flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-display font-black text-base rounded-2xl">
              {caregiver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-display font-bold text-foreground">{caregiver.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{caregiver.title}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <IconStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              <span className="text-sm font-display font-bold text-foreground">
                {caregiver.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">•</span>
              <p className="text-lg font-display font-black text-primary tracking-tighter">
                €{(caregiver.hourlyRateEur / 100).toFixed(2)}/h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl">
          <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-destructive">Erro</p>
            <p className="text-sm text-muted-foreground mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Step 1: Chat Inicial */}
      {step === 1 && (
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tighter">Chat Inicial</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              Converse com o cuidador sobre a oportunidade
            </p>
          </div>

          {/* Messages Container */}
          <div className="bg-secondary rounded-3xl border border-border/50 p-5 space-y-4 h-64 overflow-y-auto">
            {/* Proposal Message */}
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0 rounded-2xl">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-display font-black rounded-2xl">
                  {caregiver.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">{caregiver.name}</p>
                <div className="bg-secondary rounded-3xl px-4 py-3 mt-1 border border-border/30">
                  <p className="text-sm text-foreground">{proposal.message}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(proposal.createdAt).toLocaleDateString('pt-PT')}
                </p>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-xs font-display font-bold uppercase tracking-widest mb-2 block">Sua Mensagem</label>
            <Textarea
              value={flowState.chatMessage}
              onChange={e => setFlowState(prev => ({ ...prev, chatMessage: e.target.value }))}
              placeholder="Responda ao cuidador com questões ou comentários..."
              rows={3}
              className="bg-secondary border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none transition-all"
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!flowState.chatMessage.trim() || flowState.isSubmitting}
            size="lg"
            className="w-full h-11 rounded-2xl font-display font-bold gap-2 shadow-glow"
          >
            {flowState.isSubmitting ? (
              <>
                <IconLoader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <IconMessageSquare className="h-4 w-4" />
                Enviar Mensagem e Continuar
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 2: Entrevista Agendada */}
      {step === 2 && (
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tighter">Agendar Entrevista</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              Combine data e hora para uma chamada de vídeo
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="date" className="text-xs font-display font-bold uppercase tracking-widest mb-2 block">
                Data da Entrevista
              </label>
              <Input
                id="date"
                type="date"
                value={flowState.interviewDate}
                onChange={e => setFlowState(prev => ({ ...prev, interviewDate: e.target.value }))}
                className="bg-secondary border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="time" className="text-xs font-display font-bold uppercase tracking-widest mb-2 block">
                Hora da Entrevista
              </label>
              <Input
                id="time"
                type="time"
                value={flowState.interviewTime}
                onChange={e => setFlowState(prev => ({ ...prev, interviewTime: e.target.value }))}
                className="bg-secondary border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-xs font-display font-bold uppercase tracking-widest mb-2 block">
                Notas (opcional)
              </label>
              <Textarea
                id="notes"
                value={flowState.interviewNotes}
                onChange={e => setFlowState(prev => ({ ...prev, interviewNotes: e.target.value }))}
                placeholder="Qualquer informação adicional para o cuidador..."
                rows={3}
                className="bg-secondary border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none transition-all"
              />
            </div>

            {/* Info Alert */}
            <div className="flex items-start gap-4 p-5 bg-info/5 border border-info/20 rounded-2xl">
              <IconInfo className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-display font-bold text-info">Dica</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Um link de vídeo será gerado automaticamente e compartilhado com o cuidador.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              size="lg"
              className="h-11 rounded-2xl px-4 border border-border"
              disabled={flowState.isSubmitting}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleScheduleInterview}
              disabled={!flowState.interviewDate || !flowState.interviewTime || flowState.isSubmitting}
              size="lg"
              className="flex-1 h-11 rounded-2xl font-display font-bold gap-2 shadow-glow"
            >
              {flowState.isSubmitting ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <IconVideo className="h-4 w-4" />
                  Agendar Entrevista
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Revisar Proposta */}
      {step === 3 && (
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tighter">Revisar Termos Propostos</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              Verifique a disponibilidade e taxa horária propostas
            </p>
          </div>

          {/* Proposal Summary */}
          <div className="space-y-4">
            <section className="space-y-2">
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                Detalhes da Proposta
              </p>
              <div className="bg-card rounded-3xl p-5 border border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa Horária Proposta:</span>
                  <span className="text-lg font-display font-black text-primary tracking-tighter">
                    €{(proposal.expectedRate).toFixed(2)}/h
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                Sobre o Cuidador
              </p>
              <div className="bg-card rounded-3xl p-5 border border-border/50">
                <p className="text-sm text-foreground line-clamp-4">{proposal.aboutYou}</p>
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                Mensagem da Proposta
              </p>
              <div className="bg-card rounded-3xl p-5 border border-border/50">
                <p className="text-sm text-foreground line-clamp-4">{proposal.message}</p>
              </div>
            </section>
          </div>

          {/* Terms Agreement */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-4 bg-secondary rounded-2xl border border-border/50 cursor-pointer hover:border-primary/30 transition-colors group">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                flowState.agreedTerms
                  ? 'bg-primary border-primary'
                  : 'border-border group-hover:border-primary'
              }`}>
                {flowState.agreedTerms && (
                  <IconCheck className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              <span className="text-sm text-foreground font-medium">
                Concordo em revisar estes termos e prosseguir para a criação do contrato
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              size="lg"
              className="h-11 rounded-2xl px-4 border border-border"
              disabled={flowState.isSubmitting}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleApproveProposal}
              disabled={!flowState.agreedTerms || flowState.isSubmitting}
              size="lg"
              className="flex-1 h-11 rounded-2xl font-display font-bold gap-2"
            >
              {flowState.isSubmitting ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4" />
                  Aprovar Proposta
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Criar Contrato */}
      {step === 4 && (
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tighter">Criar Contrato</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              Agora vamos formalizar o contrato com todos os detalhes
            </p>
          </div>

          <div className="flex items-start gap-4 p-5 bg-primary/5 border border-primary/20 rounded-2xl">
            <IconFileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-display font-bold text-foreground">Contrato Pronto</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Os detalhes da demanda e proposta serão usados para preencher automaticamente o contrato.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              size="lg"
              className="h-11 rounded-2xl px-4 border border-border"
              disabled={flowState.isSubmitting}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCreateContract}
              disabled={flowState.isSubmitting}
              size="lg"
              className="flex-1 h-11 rounded-2xl font-display font-bold gap-2 shadow-glow"
            >
              {flowState.isSubmitting ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Criando Contrato...
                </>
              ) : (
                <>
                  <IconFileText className="h-4 w-4" />
                  Criar Contrato
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmação Final */}
      {step === 5 && (
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-success/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <IconCheck className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tighter">Tudo Pronto!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              O contrato foi criado com sucesso
            </p>
          </div>

          <div className="bg-card rounded-3xl p-5 border border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cuidador:</span>
              <span className="text-sm font-display font-bold text-foreground">{caregiver.name}</span>
            </div>
            <div className="border-t border-border/50 pt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taxa Horária:</span>
              <span className="text-lg font-display font-black text-primary tracking-tighter">
                €{(proposal.expectedRate).toFixed(2)}/h
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              asChild
              size="lg"
              className="flex-1 h-11 rounded-2xl font-display font-bold shadow-glow"
            >
              <Link href={`/app/family/demands/${demandId}`}>
                Voltar para Demanda
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="flex-1 h-11 rounded-2xl font-display font-bold border border-border"
            >
              <Link href="/app/contracts">
                Ver Contratos
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProposalFlowPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto space-y-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-muted rounded-2xl" />
              <div className="h-96 bg-muted rounded-2xl" />
            </div>
          </div>
        }
      >
        <ProposalFlowContent />
      </Suspense>
    </AppShell>
  );
}
