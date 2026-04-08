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
          setProposals(proposalsData.proposals);
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
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
  }

  if (error || !demand) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Demanda não encontrada'}
          </div>
          <Link href="/app/family/demands" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  const badge = demand.visibilityPackage === 'URGENT'
    ? { bg: 'bg-red-100', text: 'text-red-800', label: '🔴 URGENTE' }
    : demand.visibilityPackage === 'PREMIUM'
    ? { bg: 'bg-blue-100', text: 'text-blue-800', label: '⭐ DESTACADO' }
    : demand.visibilityPackage === 'BASIC'
    ? { bg: 'bg-green-100', text: 'text-green-800', label: '✓ VISÍVEL' }
    : { bg: 'bg-gray-100', text: 'text-gray-800', label: 'NORMAL' };

  return (
    <AppShell>
      <div className="pb-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/app/family/demands" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Voltar
        </Link>

        {/* Demand Details */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{demand.title}</h1>
                <p className="text-gray-600">📍 {demand.city} | Status: <strong>{demand.status}</strong></p>
              </div>
              {badge && (
                <span className={`px-4 py-2 rounded-full font-semibold ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="p-8 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Visualizações</div>
                <div className="text-2xl font-bold text-gray-900">{demand.metrics.viewCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Propostas Recebidas</div>
                <div className="text-2xl font-bold text-gray-900">{demand.metrics.proposalCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Taxa de Conversão</div>
                <div className="text-2xl font-bold text-gray-900">{demand.metrics.conversionRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Gasto em Visibilidade</div>
                <div className="text-2xl font-bold text-green-600">€{demand.metrics.visibilitySpent.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {boostSuccess && (
            <div className="p-8 border-b border-green-200 bg-green-50">
              <div className="text-green-700 font-semibold">
                ✓ Boost de visibilidade ativado com sucesso! Sua demanda agora tem maior visibilidade no marketplace.
              </div>
            </div>
          )}

          {/* Boost Button */}
          <div className="p-8 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Aumentar Visibilidade</h3>
              <p className="text-sm text-gray-600">Atraia mais cuidadores com boosts (€3-15)</p>
            </div>
            <button
              onClick={() => setShowBoostModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Aumentar Visibilidade
            </button>
          </div>

          {/* Description */}
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Descrição</h2>
            <p className="text-gray-700 whitespace-pre-wrap mb-8">{demand.description}</p>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Tipos de Serviço</h3>
                <div className="flex flex-wrap gap-2">
                  {demand.serviceTypes.map((type, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                      {getServiceTypeLabel(type)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Requisitos</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Experiência:</strong> {demand.requiredExperienceLevel}</p>
                  <p><strong>Tipo:</strong> {demand.careType}</p>
                  {demand.hoursPerWeek && <p><strong>Horas/semana:</strong> {demand.hoursPerWeek}h</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Propostas Recebidas ({proposals.length})
            </h2>
          </div>

          {proposals.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Nenhuma proposta ainda. Aumente a visibilidade para atrair mais cuidadores!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {proposals.map(proposal => (
                <div key={proposal.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{proposal.caregiverName}</h3>
                      <p className="text-sm text-gray-600">{proposal.caregiverEmail}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      proposal.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : proposal.status === 'ACCEPTED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {proposal.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-700">
                    <div>
                      <div className="text-xs text-gray-600">Experiência</div>
                      <div className="font-semibold">{proposal.experienceYears || 'N/A'} anos</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Taxa Horária Proposta</div>
                      <div className="font-semibold">
                        €{proposal.proposedHourlyRate ? (proposal.proposedHourlyRate / 100).toFixed(2) : proposal.standardHourlyRate}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Data de Início</div>
                      <div className="font-semibold">
                        {proposal.estimatedStartDate
                          ? new Date(proposal.estimatedStartDate).toLocaleDateString('pt-PT')
                          : 'Não especificada'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded mb-4">
                    <p className="text-gray-700">{proposal.message}</p>
                  </div>

                  <div className="flex gap-2 text-sm">
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                      Aceitar
                    </button>
                    <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                      Rejeitar
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Contatar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
      </div>
    </AppShell>
  );
}
