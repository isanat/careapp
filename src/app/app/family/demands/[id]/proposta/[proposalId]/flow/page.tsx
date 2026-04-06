'use client';

import { Suspense } from 'react';
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
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 flex items-start gap-4">
          <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">{error || 'Proposta não encontrada'}</p>
            <Button asChild className="mt-4 h-10 rounded-lg">
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
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fluxo de Proposta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Finalize a proposta do cuidador
          </p>
        </div>
        <Link
          href={`/app/family/demands/${demandId}`}
          className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          aria-label="Fechar"
        >
          <IconX className="h-5 w-5" />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Passo {step} de {totalSteps}
          </span>
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Caregiver Info Card */}
      <Card className="border-border/50 mb-8 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {caregiver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{caregiver.name}</p>
              <p className="text-xs text-muted-foreground">{caregiver.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <IconStar className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs text-muted-foreground">
                  {caregiver.averageRating.toFixed(1)} • €{(caregiver.hourlyRateEur / 100).toFixed(2)}/h
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {submitError && (
        <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl mb-6">
          <IconAlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      {/* Step 1: Chat Inicial */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Chat Inicial</h2>
            <p className="text-sm text-muted-foreground">
              Converse com o cuidador sobre a oportunidade
            </p>
          </div>

          {/* Messages Container */}
          <div className="bg-surface rounded-xl border border-border/50 p-4 space-y-3 h-64 overflow-y-auto">
            {/* Proposal Message */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-secondary/10 text-secondary text-xs font-bold">
                  {caregiver.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{caregiver.name}</p>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm">{proposal.message}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(proposal.createdAt).toLocaleDateString('pt-PT')}
                </p>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sua Mensagem</Label>
            <Textarea
              value={flowState.chatMessage}
              onChange={e => setFlowState(prev => ({ ...prev, chatMessage: e.target.value }))}
              placeholder="Responda ao cuidador com questões ou comentários..."
              rows={3}
              className="rounded-xl text-sm resize-none"
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!flowState.chatMessage.trim() || flowState.isSubmitting}
            size="lg"
            className="w-full h-11 rounded-xl font-semibold gap-2"
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
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Agendar Entrevista</h2>
            <p className="text-sm text-muted-foreground">
              Combine data e hora para uma chamada de vídeo
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Data da Entrevista
              </Label>
              <Input
                id="date"
                type="date"
                value={flowState.interviewDate}
                onChange={e => setFlowState(prev => ({ ...prev, interviewDate: e.target.value }))}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium">
                Hora da Entrevista
              </Label>
              <Input
                id="time"
                type="time"
                value={flowState.interviewTime}
                onChange={e => setFlowState(prev => ({ ...prev, interviewTime: e.target.value }))}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notas (opcional)
              </Label>
              <Textarea
                id="notes"
                value={flowState.interviewNotes}
                onChange={e => setFlowState(prev => ({ ...prev, interviewNotes: e.target.value }))}
                placeholder="Qualquer informação adicional para o cuidador..."
                rows={3}
                className="rounded-xl text-sm resize-none"
              />
            </div>

            {/* Info Alert */}
            <div className="flex gap-3 p-3 bg-info/5 border border-info/20 rounded-lg">
              <IconInfo className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
              <p className="text-xs text-info">
                Um link de vídeo será gerado automaticamente e compartilhado com o cuidador.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              size="lg"
              className="h-11 rounded-xl px-4"
              disabled={flowState.isSubmitting}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleScheduleInterview}
              disabled={!flowState.interviewDate || !flowState.interviewTime || flowState.isSubmitting}
              size="lg"
              className="flex-1 h-11 rounded-xl font-semibold gap-2"
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
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Revisar Termos Propostos</h2>
            <p className="text-sm text-muted-foreground">
              Verifique a disponibilidade e taxa horária propostas
            </p>
          </div>

          {/* Proposal Summary */}
          <div className="space-y-3">
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Detalhes da Proposta
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taxa Horária Proposta:</span>
                    <span className="text-sm font-semibold">
                      €{(proposal.expectedRate).toFixed(2)}/h
                    </span>
                  </div>
                  <div className="border-t border-border/50 pt-2 mt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Sobre o Cuidador
                    </p>
                    <p className="text-sm line-clamp-4">{proposal.aboutYou}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Mensagem da Proposta
                </p>
                <p className="text-sm line-clamp-4">{proposal.message}</p>
              </CardContent>
            </Card>
          </div>

          {/* Terms Agreement */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border/50 cursor-pointer hover:border-primary/30 transition-colors">
              <input
                type="checkbox"
                checked={flowState.agreedTerms}
                onChange={e => setFlowState(prev => ({ ...prev, agreedTerms: e.target.checked }))}
                className="mt-1"
              />
              <span className="text-sm">
                Concordo em revisar estes termos e prosseguir para a criação do contrato
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              size="lg"
              className="h-11 rounded-xl px-4"
              disabled={flowState.isSubmitting}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleApproveProposal}
              disabled={!flowState.agreedTerms || flowState.isSubmitting}
              size="lg"
              className="flex-1 h-11 rounded-xl font-semibold gap-2"
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
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Criar Contrato</h2>
            <p className="text-sm text-muted-foreground">
              Agora vamos formalizar o contrato com todos os detalhes
            </p>
          </div>

          <Card className="border-border/50 bg-primary/5 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <IconFileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Contrato Pronto</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os detalhes da demanda e proposta serão usados para preencher automaticamente o contrato.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              size="lg"
              className="h-11 rounded-xl px-4"
              disabled={flowState.isSubmitting}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCreateContract}
              disabled={flowState.isSubmitting}
              size="lg"
              className="flex-1 h-11 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/25"
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
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconCheck className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-lg font-bold">Tudo Pronto!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              O contrato foi criado com sucesso
            </p>
          </div>

          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cuidador:</span>
                <span className="text-sm font-semibold">{caregiver.name}</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taxa Horária:</span>
                <span className="text-sm font-semibold">
                  €{(proposal.expectedRate).toFixed(2)}/h
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              asChild
              size="lg"
              className="w-full h-11 rounded-xl font-semibold"
            >
              <Link href={`/app/family/demands/${demandId}`}>
                Voltar para Demanda
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-11 rounded-xl font-semibold"
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
