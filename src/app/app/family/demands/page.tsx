'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DemandMetrics {
  viewCount: number;
  proposalCount: number;
  conversionRate: number;
  visibilitySpent: string;
}

interface Demand {
  id: string;
  title: string;
  description: string;
  city: string;
  status: string;
  visibilityPackage: string;
  visibilityExpiresAt: string | null;
  createdAt: string;
  closedAt: string | null;
  metrics: DemandMetrics;
}

interface FamilyAnalytics {
  totalVisibilitySpent: number;
  avgProposalsPerDemand: number;
  avgViewsPerDemand: number;
  activeDemands: number;
  closedDemands: number;
}

export default function FamilyDemandsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [analytics, setAnalytics] = useState<FamilyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch demands
        const demandsRes = await fetch(`/api/family/demands?status=${statusFilter}`);
        if (!demandsRes.ok) throw new Error('Failed to fetch demands');
        const demandsData = await demandsRes.json();
        setDemands(demandsData.demands);

        // Fetch analytics
        const analyticsRes = await fetch('/api/family/demands/analytics');
        if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, statusFilter]);

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Suas Demandas</h1>
            <Link
              href="/app/family/demands/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Criar Demanda
            </Link>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Demandas Ativas</div>
                <div className="text-2xl font-bold text-gray-900">{analytics.activeDemands}</div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Demandas Fechadas</div>
                <div className="text-2xl font-bold text-gray-900">{analytics.closedDemands}</div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Gasto em Visibilidade</div>
                <div className="text-2xl font-bold text-gray-900">€{analytics.totalVisibilitySpent.toFixed(2)}</div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Propostas/Demanda (avg)</div>
                <div className="text-2xl font-bold text-gray-900">{analytics.avgProposalsPerDemand.toFixed(1)}</div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Views/Demanda (avg)</div>
                <div className="text-2xl font-bold text-gray-900">{analytics.avgViewsPerDemand.toFixed(1)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2">
          {['ACTIVE', 'CLOSED', 'PAUSED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'ACTIVE' && 'Ativas'}
              {status === 'CLOSED' && 'Fechadas'}
              {status === 'PAUSED' && 'Em Pausa'}
            </button>
          ))}
        </div>

        {/* Demands Table */}
        {demands.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Nenhuma demanda neste status</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visibilidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propostas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gasto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {demands.map(demand => (
                  <tr key={demand.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{demand.title}</div>
                      <div className="text-sm text-gray-600">{demand.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{demand.city}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        demand.visibilityPackage === 'URGENT' ? 'bg-red-100 text-red-800' :
                        demand.visibilityPackage === 'PREMIUM' ? 'bg-blue-100 text-blue-800' :
                        demand.visibilityPackage === 'BASIC' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {demand.visibilityPackage || 'Nenhum'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{demand.metrics.viewCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{demand.metrics.proposalCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{demand.metrics.conversionRate.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-sm text-gray-900">€{demand.metrics.visibilitySpent}</td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/app/family/demands/${demand.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
