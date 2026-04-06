'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconArrowLeft,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconStar,
  IconTrendingUp,
  IconEuro,
} from '@/components/icons';

interface Demand {
  id: string;
  title: string;
  description: string;
  city: string;
  serviceTypes: string[];
}

const PACKAGE_DETAILS: Record<string, { label: string; price: number; desc: string; days: number; icon: any }> = {
  BASIC: {
    label: 'BASIC',
    price: 3,
    desc: '7 dias de visibilidade padrão',
    days: 7,
    icon: IconEuro,
  },
  PREMIUM: {
    label: 'PREMIUM',
    price: 8,
    desc: '30 dias destacado na plataforma',
    days: 30,
    icon: IconStar,
  },
  URGENT: {
    label: 'URGENTE',
    price: 15,
    desc: '3 dias no topo da lista de demandas',
    days: 3,
    icon: IconTrendingUp,
  },
};

function BoostContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const demandId = params.id as string;
  const packageType = (searchParams.get('package') || 'BASIC') as string;

  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !demandId) return;

    const fetchDemand = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/demands/${demandId}`);
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
  }, [demandId, status]);

  const handleCheckout = async () => {
    if (!demandId) return;

    setProcessing(true);

    try {
      // Create checkout session
      const res = await fetch(`/api/demands/${demandId}/boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: packageType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao processar checkout');
      }

      const { url } = await res.json();

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Falha ao obter URL de checkout');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setProcessing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  const pkgDetails = PACKAGE_DETAILS[packageType] || PACKAGE_DETAILS.BASIC;
  const Icon = pkgDetails.icon;

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/app/family/demands"
          className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          aria-label="Voltar"
        >
          <IconArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Aumentar Visibilidade</h1>
          <p className="text-sm text-muted-foreground">Checkout seguro com Stripe</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl mb-6">
          <IconAlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {demand && (
        <div className="space-y-6">
          {/* Demand Summary */}
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Demanda
              </p>
              <div className="space-y-2">
                <h2 className="font-semibold text-lg">{demand.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {demand.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {demand.serviceTypes.slice(0, 2).map((service, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-[10px] font-medium px-2 py-0.5 h-auto"
                    >
                      {service.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  {demand.serviceTypes.length > 2 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium px-2 py-0.5 h-auto"
                    >
                      +{demand.serviceTypes.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Selection */}
          <Card className="border-primary/20 overflow-hidden bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{pkgDetails.label}</p>
                  <p className="text-sm text-muted-foreground">{pkgDetails.desc}</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold">€{pkgDetails.price}</span>
                    <span className="text-xs text-muted-foreground">
                      ({pkgDetails.days} dias)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Benefícios
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <IconCheck className="h-4 w-4 text-success" />
                  <span>Demanda em destaque por {pkgDetails.days} dias</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <IconCheck className="h-4 w-4 text-success" />
                  <span>Mais visualizações de cuidadores</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <IconCheck className="h-4 w-4 text-success" />
                  <span>Maiores chances de receber propostas</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Info */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground">
              💳 Pagamento seguro com <strong>Stripe</strong>. Sua demanda será publicada imediatamente após confirmação.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              asChild
              size="lg"
              className="h-11 rounded-xl px-4"
            >
              <Link href="/app/family/demands">Voltar</Link>
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={processing}
              size="lg"
              className="flex-1 h-11 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/25"
            >
              {processing ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Pagar €{pkgDetails.price}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BoostPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="max-w-lg mx-auto space-y-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-muted rounded-2xl" />
              <div className="h-64 bg-muted rounded-2xl" />
            </div>
          </div>
        }
      >
        <BoostContent />
      </Suspense>
    </AppShell>
  );
}
