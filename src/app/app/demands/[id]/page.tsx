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

      toast({title: "Sucesso", description: "Proposta enviada com sucesso!"}); // OLD: alert-style
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <Link href="/app/demands" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  if (!demand) return null;

  const badge = demand.visibilityPackage === 'URGENT'
    ? { bg: 'bg-red-100', text: 'text-red-800', label: '🔴 URGENTE' }
    : demand.visibilityPackage === 'PREMIUM'
    ? { bg: 'bg-blue-100', text: 'text-blue-800', label: '⭐ DESTACADO' }
    : demand.visibilityPackage === 'BASIC'
    ? { bg: 'bg-green-100', text: 'text-green-800', label: '✓ VISÍVEL' }
    : { bg: 'bg-gray-100', text: 'text-gray-800', label: 'NORMAL' };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-8 space-y-4">
        <Link href="/app/demands" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Voltar
        </Link>

        <div className="bg-white rounded-lg shadow mb-8">
          {/* Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{demand.title}</h1>
                <p className="text-gray-600">
                  👤 Família em <strong>{demand.familyCity}</strong> | 📍 {demand.city}
                  {demand.postalCode && ` (${demand.postalCode})`}
                </p>
              </div>
              {badge && (
                <span className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="p-8 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Visualizações</div>
                <div className="text-2xl font-bold text-gray-900">{demand.metrics.viewCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Propostas</div>
                <div className="text-2xl font-bold text-gray-900">{demand.metrics.proposalCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Taxa Conversão</div>
                <div className="text-2xl font-bold text-gray-900">{demand.metrics.conversionRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Criada há</div>
                <div className="text-2xl font-bold text-gray-900">{demand.metrics.daysActive} dias</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Descrição Detalhada</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{demand.description}</p>
            </div>

            {/* Service Types */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Tipos de Serviço</h3>
              <div className="flex flex-wrap gap-2">
                {demand.serviceTypes.map((service, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {getServiceTypeLabel(service)}
                  </span>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Requisitos</h3>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Nível de Experiência:</strong> {demand.requiredExperienceLevel}
                  </p>
                  {demand.requiredCertifications.length > 0 && (
                    <div>
                      <strong>Certificações:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {demand.requiredCertifications.map((cert, idx) => (
                          <li key={idx}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p>
                    <strong>Tipo de Cuidado:</strong> {demand.careType}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Detalhes Práticos</h3>
                <div className="space-y-2 text-gray-700">
                  {demand.hoursPerWeek && (
                    <p>
                      <strong>Horas/Semana:</strong> {demand.hoursPerWeek}h
                    </p>
                  )}
                  {demand.desiredStartDate && (
                    <p>
                      <strong>Data de Início:</strong> {new Date(demand.desiredStartDate).toLocaleDateString('pt-PT')}
                    </p>
                  )}
                  {demand.desiredEndDate && (
                    <p>
                      <strong>Data de Término:</strong> {new Date(demand.desiredEndDate).toLocaleDateString('pt-PT')}
                    </p>
                  )}
                  <p>
                    <strong>Endereço:</strong> {demand.address || 'Não especificado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Proposal Form */}
            <div className="bg-gray-50 p-8 rounded-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Enviar Proposta</h2>

              <form onSubmit={handleSendProposal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sua Mensagem * (mín. 20 caracteres)
                  </label>
                  <textarea
                    value={proposalMessage}
                    onChange={e => setProposalMessage(e.target.value)}
                    placeholder="Apresente-se brevemente, descreva sua experiência, e por que é a pessoa certa para o trabalho..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    {proposalMessage.length}/20 caracteres mínimos
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa Horária Proposta (€/hora)
                    </label>
                    <input
                      type="number"
                      value={proposedHourlyRate}
                      onChange={e => setProposedHourlyRate(e.target.value)}
                      min="0"
                      step="0.50"
                      placeholder="Ex: 12.50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início Estimada
                    </label>
                    <input
                      type="date"
                      value={estimatedStartDate}
                      onChange={e => setEstimatedStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={proposing}
                    className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {proposing ? 'Enviando...' : 'Enviar Proposta'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/app/demands')}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
