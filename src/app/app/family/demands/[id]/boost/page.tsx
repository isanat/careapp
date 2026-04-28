"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconArrowLeft,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconStar,
  IconTrendingUp,
  IconEuro,
} from "@/components/icons";

interface Demand {
  id: string;
  title: string;
  description: string;
  city: string;
  serviceTypes: string[];
}

const PACKAGE_DETAILS: Record<
  string,
  { label: string; price: number; desc: string; days: number; icon: any }
> = {
  BASIC: {
    label: "BASIC",
    price: 3,
    desc: "7 dias de visibilidade padrão",
    days: 7,
    icon: IconEuro,
  },
  PREMIUM: {
    label: "PREMIUM",
    price: 8,
    desc: "30 dias destacado na plataforma",
    days: 30,
    icon: IconStar,
  },
  URGENT: {
    label: "URGENTE",
    price: 15,
    desc: "3 dias no topo da lista de demandas",
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
  const packageType = (searchParams.get("package") || "BASIC") as string;

  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !demandId) return;

    const fetchDemand = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/demands/${demandId}`);
        if (!res.ok) throw new Error("Demanda não encontrada");
        const data = await res.json();
        setDemand(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar demanda",
        );
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package: packageType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Falha ao processar checkout");
      }

      const { url } = await res.json();

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Falha ao obter URL de checkout");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setProcessing(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded-3xl" />
          <div className="h-64 bg-muted rounded-3xl" />
        </div>
      </div>
    );
  }

  const pkgDetails = PACKAGE_DETAILS[packageType] || PACKAGE_DETAILS.BASIC;
  const Icon = pkgDetails.icon;

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header with Back Button */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/app/family/demands"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          aria-label="Voltar"
        >
          <IconArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2 tracking-tighter">
            Aumentar Visibilidade
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Checkout seguro com Stripe
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl mb-6">
          <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {demand && (
        <div className="space-y-6">
          {/* Demand Info Card */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Demanda Atual
            </h4>
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground mb-2">
                    {demand.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {demand.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {demand.serviceTypes.slice(0, 2).map((service, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded-lg"
                    >
                      {service.replace(/_/g, " ")}
                    </span>
                  ))}
                  {demand.serviceTypes.length > 2 && (
                    <span className="text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded-lg">
                      +{demand.serviceTypes.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Cards Grid */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Pacotes Disponíveis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(PACKAGE_DETAILS).map(([key, pkg]) => {
                const isSelected = key === packageType;
                return (
                  <Link
                    key={key}
                    href={`?package=${key}`}
                    className={`bg-card rounded-3xl p-5 sm:p-7 border shadow-card transition-all cursor-pointer group ${
                      isSelected
                        ? "bg-primary/5 border-primary/30 shadow-elevated"
                        : "border-border hover:shadow-elevated hover:border-primary/30"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Badge */}
                      <span className="text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded-lg inline-block">
                        {pkg.label}
                      </span>

                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                        <pkg.icon className="h-5 w-5 text-success" />
                      </div>

                      {/* Price */}
                      <div>
                        <div className="text-3xl font-display font-black text-foreground tracking-tighter mb-2">
                          €{pkg.price}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {pkg.desc}
                        </p>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-2 pt-3 border-t border-border/50">
                        <li className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                            <IconCheck className="h-3 w-3 text-success" />
                          </div>
                          <span className="text-sm text-muted-foreground leading-relaxed">
                            {pkg.days} dias de visibilidade
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                            <IconCheck className="h-3 w-3 text-success" />
                          </div>
                          <span className="text-sm text-muted-foreground leading-relaxed">
                            Mais visualizações
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                            <IconCheck className="h-3 w-3 text-success" />
                          </div>
                          <span className="text-sm text-muted-foreground leading-relaxed">
                            Maiores chances
                          </span>
                        </li>
                      </ul>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Summary Box */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Resumo
            </h4>
            <div className="bg-secondary/30 rounded-3xl p-5 sm:p-7 border border-border/50">
              <div className="flex items-baseline justify-between">
                <span className="text-base text-muted-foreground font-medium">
                  Pacote selecionado ({pkgDetails.label}):
                </span>
                <span className="text-2xl font-display font-black text-primary tracking-tighter">
                  €{pkgDetails.price}
                </span>
              </div>
            </div>
          </section>

          {/* Info Banner */}
          <div className="bg-info/5 p-5 rounded-2xl border border-info/20 flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-display font-bold text-info">
                i
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pagamento 100% seguro com{" "}
              <strong className="text-foreground">Stripe</strong>. Sua demanda
              será publicada imediatamente após confirmação.
            </p>
          </div>

          {/* Submit Section */}
          <div className="border-t border-border pt-6 mt-6 space-y-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                asChild
                size="lg"
                className="rounded-2xl px-6 h-12 font-display font-bold uppercase text-sm tracking-wide"
              >
                <Link href="/app/family/demands">Voltar</Link>
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={processing}
                size="lg"
                className="flex-1 rounded-2xl px-6 h-12 font-display font-bold uppercase text-sm tracking-wide gap-2 shadow-lg shadow-primary/25"
              >
                {processing ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>Pagar €{pkgDetails.price}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BoostPage() {
  return (
    
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
    
  );
}
