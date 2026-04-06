'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SERVICE_TYPES = [
  'PERSONAL_CARE',
  'MEDICATION',
  'MOBILITY',
  'COMPANIONSHIP',
  'MEAL_PREPARATION',
  'LIGHT_HOUSEWORK',
  'TRANSPORTATION',
  'COGNITIVE_SUPPORT',
  'NIGHT_CARE',
  'PALLIATIVE_CARE',
  'PHYSIOTHERAPY',
  'NURSING_CARE',
];

const SERVICE_LABELS: Record<string, string> = {
  PERSONAL_CARE: 'Cuidados Pessoais',
  MEDICATION: 'Administração de Medicação',
  MOBILITY: 'Ajuda com Mobilidade',
  COMPANIONSHIP: 'Companhia e Conversa',
  MEAL_PREPARATION: 'Preparo de Refeições',
  LIGHT_HOUSEWORK: 'Tarefas Domésticas',
  TRANSPORTATION: 'Transporte',
  COGNITIVE_SUPPORT: 'Estimulação Cognitiva',
  NIGHT_CARE: 'Cuidados Noturnos',
  PALLIATIVE_CARE: 'Cuidados Paliativos',
  PHYSIOTHERAPY: 'Fisioterapia',
  NURSING_CARE: 'Enfermagem',
};

export default function NewDemandPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceTypes: [] as string[],
    address: '',
    city: '',
    postalCode: '',
    requiredExperienceLevel: 'INTERMEDIATE',
    requiredCertifications: [] as string[],
    careType: 'RECURRING',
    desiredStartDate: '',
    desiredEndDate: '',
    hoursPerWeek: '',
  });

  const handleServiceTypeChange = (serviceType: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceType)
        ? prev.serviceTypes.filter(s => s !== serviceType)
        : [...prev.serviceTypes, serviceType],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Título é obrigatório');
      }

      if (formData.description.length < 100) {
        throw new Error('Descrição deve ter pelo menos 100 caracteres');
      }

      if (formData.serviceTypes.length === 0) {
        throw new Error('Selecione pelo menos um tipo de serviço');
      }

      if (!formData.city.trim()) {
        throw new Error('Localidade é obrigatória');
      }

      const res = await fetch('/api/demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          serviceTypes: formData.serviceTypes,
          address: formData.address || undefined,
          city: formData.city,
          postalCode: formData.postalCode || undefined,
          requiredExperienceLevel: formData.requiredExperienceLevel,
          requiredCertifications: formData.requiredCertifications,
          careType: formData.careType,
          desiredStartDate: formData.desiredStartDate || undefined,
          desiredEndDate: formData.desiredEndDate || undefined,
          hoursPerWeek: formData.hoursPerWeek ? parseInt(formData.hoursPerWeek) : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao criar demanda');
      }

      const data = await res.json();
      router.push(`/app/family/demands/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'unauthenticated') {
    return <div className="text-center py-8">Faça login para continuar</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/app/family/demands" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Voltar
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-6">Criar Nova Demanda</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Demanda *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Cuidadora para idosa em Lisboa"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição Detalhada * (mín. 100 caracteres)
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva detalhadamente a necessidade, condições, horários, etc."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-sm text-gray-600 mt-1">
                {formData.description.length}/100 caracteres mínimos
              </div>
            </div>

            {/* Service Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipos de Serviço * (selecione um ou mais)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SERVICE_TYPES.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.serviceTypes.includes(type)}
                      onChange={() => handleServiceTypeChange(type)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{SERVICE_LABELS[type]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localidade *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Ex: Lisboa"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={e => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="Ex: 1000-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Endereço detalhado (opcional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível de Experiência Requerido
              </label>
              <select
                value={formData.requiredExperienceLevel}
                onChange={e => setFormData(prev => ({ ...prev, requiredExperienceLevel: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="BEGINNER">Iniciante</option>
                <option value="INTERMEDIATE">Intermediário</option>
                <option value="ADVANCED">Avançado</option>
                <option value="EXPERT">Especialista</option>
              </select>
            </div>

            {/* Care Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cuidado
              </label>
              <select
                value={formData.careType}
                onChange={e => setFormData(prev => ({ ...prev, careType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="URGENT">Urgente</option>
                <option value="RECURRING">Recorrente</option>
                <option value="BOTH">Ambos</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Desejada de Início
                </label>
                <input
                  type="date"
                  value={formData.desiredStartDate}
                  onChange={e => setFormData(prev => ({ ...prev, desiredStartDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Desejada de Término
                </label>
                <input
                  type="date"
                  value={formData.desiredEndDate}
                  onChange={e => setFormData(prev => ({ ...prev, desiredEndDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Hours per Week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas por Semana
              </label>
              <input
                type="number"
                value={formData.hoursPerWeek}
                onChange={e => setFormData(prev => ({ ...prev, hoursPerWeek: e.target.value }))}
                min="0"
                placeholder="Ex: 20"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Demanda'}
              </button>
              <Link
                href="/app/family/demands"
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
