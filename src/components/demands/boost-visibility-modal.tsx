'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Aumentar Visibilidade
          </DialogTitle>
          <DialogDescription>{demandTitle}</DialogDescription>
        </DialogHeader>

        <div>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition ${
                  pkg.recommended
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                {pkg.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    RECOMENDADO
                  </div>
                )}

                <div className="mb-4">
                  <div className="inline-block px-2 py-1 rounded text-xs font-semibold mb-2 bg-muted text-muted-foreground">
                    {pkg.badge}
                  </div>
                  <h3 className="font-bold text-foreground mb-1">
                    {pkg.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {pkg.description}
                  </p>

                  <div className="mb-3">
                    <div className="text-2xl font-bold text-foreground">
                      €{pkg.price}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pkg.duration}
                    </div>
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

          <div className="bg-muted p-4 rounded text-sm text-muted-foreground mb-4">
            <p className="font-semibold mb-2 text-foreground">
              Dicas para aumentar propostas:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Use descrição clara e detalhada</li>
              <li>Especifique o nível de experiência requerido</li>
              <li>Premium dura 30 dias - excelente valor</li>
              <li>URGENT é perfeito para necessidades imediatas</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
