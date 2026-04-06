'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
}

const VISIBILITY_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  URGENT: { bg: 'bg-red-100', text: 'text-red-800', label: '🔴 URGENTE' },
  PREMIUM: { bg: 'bg-blue-100', text: 'text-blue-800', label: '⭐ DESTACADO' },
  BASIC: { bg: 'bg-green-100', text: 'text-green-800', label: '✓ VISÍVEL' },
  NONE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'NORMAL' },
};

export default function DemandsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState('');
  const [selectedService, setSelectedService] = useState('');

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

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Marketplace de Demandas</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Localidade</label>
              <input
                type="text"
                value={searchCity}
                onChange={e => setSearchCity(e.target.value)}
                placeholder="Ex: Lisboa, Porto..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Serviço</label>
              <select
                value={selectedService}
                onChange={e => setSelectedService(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Nenhuma demanda encontrada com esses critérios</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demands.map(demand => {
              const badge = VISIBILITY_BADGES[demand.visibilityPackage];
              const createdDate = new Date(demand.createdAt);
              const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div key={demand.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                  {/* Header com Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{demand.title}</h3>
                      <p className="text-sm text-gray-600">
                        📍 {demand.city} {demand.postalCode && `(${demand.postalCode})`}
                      </p>
                    </div>
                    {badge && (
                      <span className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {demand.description}
                  </p>

                  {/* Service Types */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {demand.serviceTypes.slice(0, 3).map((service, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {service.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {demand.serviceTypes.length > 3 && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          +{demand.serviceTypes.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                    {demand.hoursPerWeek && (
                      <div>
                        <div className="text-xs text-gray-500">Horas/semana</div>
                        <div className="font-semibold">{demand.hoursPerWeek}h</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-500">Criada há</div>
                      <div className="font-semibold">{daysAgo === 0 ? 'Hoje' : `${daysAgo}d`}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Visualizações</div>
                      <div className="font-semibold">{demand.viewCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Propostas</div>
                      <div className="font-semibold">{demand.proposalCount}</div>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/app/demands/${demand.id}`}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center font-medium"
                  >
                    Ver Detalhes & Propor
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
