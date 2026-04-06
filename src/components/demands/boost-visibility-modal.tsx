'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface BoostVisibilityModalProps {
  demandId: string;
  demandTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PACKAGES = [
  {
    name: 'BASIC',
    label: 'Visibilidade Básica',
    price: 3,
    duration: '7 dias',
    description: 'Apareça na audiência padrão',
    badge: '✓ VISÍVEL',
  },
  {
    name: 'PREMIUM',
    label: 'Visibilidade Premium',
    price: 8,
    duration: '30 dias',
    description: 'Destaque no ranking de demandas',
    badge: '⭐ DESTACADO',
    recommended: true,
  },
  {
    name: 'URGENT',
    label: 'Visibilidade Urgente',
    price: 15,
    duration: '3 dias',
    description: 'Topo da lista, máxima visibilidade',
    badge: '🔴 URGENTE',
  },
];

export function BoostVisibilityModal({
  demandId,
  demandTitle,
  isOpen,
  onClose,
  onSuccess,
}: BoostVisibilityModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPackage = async (packageName: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/demands/${demandId}/boost/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: packageName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao criar checkout');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Aumentar Visibilidade</h2>
              <p className="text-sm text-gray-600 mt-1">{demandTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              disabled={loading}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {PACKAGES.map(pkg => (
              <div
                key={pkg.name}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition ${
                  pkg.recommended
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {pkg.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMENDADO
                  </div>
                )}

                <div className="mb-4">
                  <div className="inline-block px-2 py-1 rounded text-xs font-semibold mb-2 bg-gray-100 text-gray-800">
                    {pkg.badge}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{pkg.label}</h3>
                  <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>

                  <div className="mb-3">
                    <div className="text-2xl font-bold text-gray-900">€{pkg.price}</div>
                    <div className="text-xs text-gray-600">{pkg.duration}</div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSelectPackage(pkg.name)}
                  disabled={loading}
                  className="w-full"
                  variant={pkg.recommended ? 'default' : 'outline'}
                >
                  {loading ? 'Processando...' : 'Selecionar'}
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 mb-4">
            <p className="font-semibold mb-2">Dicas para aumentar propostas:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Use descrição clara e detalhada</li>
              <li>Especifique o nível de experiência requerido</li>
              <li>Premium dura 30 dias - excelente valor</li>
              <li>URGENT é perfeito para necessidades imediatas</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
