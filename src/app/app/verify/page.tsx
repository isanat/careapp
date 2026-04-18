"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import {
  IconShield,
  IconCheck,
  IconX,
  IconLoader2,
  IconClock,
  IconCamera,
  IconId,
  IconSun,
  IconCreditCard,
  IconStar,
  IconTrendingUp,
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

interface KycStatus {
  verification_status: VerificationStatus;
  session_id?: string;
  session_created_at?: string;
  completed_at?: string;
  document_verified?: boolean;
}

export default function VerifyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  const isFamily = session?.user?.role === "FAMILY";
  const isCaregiver = session?.user?.role === "CAREGIVER";

  useEffect(() => {
    if (status === "authenticated") {
      if (isFamily) {
        // Familiares não precisam de verificação KYC, redirect para dashboard
        setTimeout(() => {
          router.push("/app/panel");
        }, 1000);
        setIsLoading(false);
      } else if (isCaregiver) {
        fetchKycStatus();
      }
    }
  }, [status, isFamily, isCaregiver, router]);

  const fetchKycStatus = async () => {
    try {
      const response = await apiFetch("/api/kyc");
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.kyc.error);
      }
    } catch (err) {
      console.error("Error fetching KYC status:", err);
      setError(t.kyc.error);
    } finally {
      setIsLoading(false);
    }
  };

  const startVerification = async () => {
    setIsStarting(true);
    setError("");

    try {
      const response = await apiFetch("/api/kyc", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.kyc.error);
      }

      if (data.url) {
        window.open(data.url, "_blank");
        setTimeout(() => fetchKycStatus(), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.kyc.error);
    } finally {
      setIsStarting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-8 max-w-2xl">
          <div className="h-20 bg-muted rounded-3xl" />
          <div className="h-64 bg-muted rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  // Familiares veem página de confiança em vez de KYC
  if (isFamily) {
    return (
      <AppShell>
        <div className="space-y-8 max-w-2xl">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2">
              Score de Confiança
            </h1>
            <p className="text-base text-muted-foreground font-medium">
              Aumente sua confiabilidade entre cuidadores
            </p>
          </div>

          {/* Trust Score Card */}
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="text-5xl font-display font-black text-primary mb-2">
                0
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Contratos completados
              </p>
              <span className="px-3 py-1 text-[10px] font-display font-bold rounded-lg uppercase tracking-widest bg-primary/10 text-primary mt-4 mb-4">
                Novo Membro
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Complete contratos com cuidadores para construir seu score de
                confiança
              </p>
            </div>
          </div>

          {/* Payment Badge */}
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-display font-bold uppercase flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-success/10 flex items-center justify-center">
                  <IconCreditCard className="h-5 w-5 text-success" />
                </div>
                Pagamento Verificado
              </h3>
              <div className="flex items-center justify-between p-4 bg-secondary rounded-2xl border border-border/50">
                <div>
                  <p className="text-sm font-display font-bold text-foreground">
                    Status: <span className="text-success">Verificado</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seu método de pagamento foi verificado com sucesso
                  </p>
                </div>
                <IconCheck className="h-6 w-6 text-success shrink-0" />
              </div>
            </div>
          </div>

          {/* Trust Building Tips */}
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
            <h3 className="text-lg sm:text-xl font-display font-bold uppercase mb-5">
              Como aumentar sua confiabilidade
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                  <IconCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-display font-bold text-foreground">
                    Complete contratos com sucesso
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cada contato completado aumenta seu score
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                  <IconStar className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-display font-bold text-foreground">
                    Receba avaliações positivas
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cuidadores avaliam sua comunicação e profissionalismo
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-info/10 flex items-center justify-center shrink-0 mt-0.5">
                  <IconTrendingUp className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm font-display font-bold text-foreground">
                    Mantenha um histórico limpo
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sem atrasos em pagamentos ou cancelamentos
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <Button onClick={() => router.push("/app/panel")} className="w-full">
            Ir para Dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  // Cuidadores veem verificação KYC
  const getStatusBadge = () => {
    switch (kycStatus?.verification_status) {
      case "VERIFIED":
        return <Badge className="bg-green-500">{t.kyc.status.verified}</Badge>;
      case "PENDING":
        return <Badge variant="secondary">{t.kyc.status.pending}</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">{t.kyc.status.rejected}</Badge>;
      default:
        return <Badge variant="outline">{t.kyc.status.unverified}</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (kycStatus?.verification_status) {
      case "VERIFIED":
        return <IconCheck className="h-16 w-16 text-green-500" />;
      case "PENDING":
        return <IconClock className="h-16 w-16 text-yellow-500" />;
      case "REJECTED":
        return <IconX className="h-16 w-16 text-destructive" />;
      default:
        return <IconShield className="h-16 w-16 text-muted-foreground" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2">
            {t.kyc.title}
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            {t.kyc.description}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
          <div className="flex flex-col items-center text-center space-y-4">
            {getStatusIcon()}
            <div>{getStatusBadge()}</div>

            {kycStatus?.verification_status === "VERIFIED" && (
              <>
                <h2 className="text-lg sm:text-xl font-display font-bold uppercase text-success mt-2">
                  {t.kyc.verifiedTitle}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.kyc.verifiedDesc}
                </p>
                {kycStatus.completed_at && (
                  <p className="text-xs text-muted-foreground font-display font-bold uppercase tracking-widest mt-2">
                    {t.kyc.completedAt}:{" "}
                    {new Date(kycStatus.completed_at).toLocaleDateString()}
                  </p>
                )}
              </>
            )}

            {kycStatus?.verification_status === "PENDING" && (
              <>
                <h2 className="text-lg sm:text-xl font-display font-bold uppercase text-warning mt-2">
                  {t.kyc.inProgress}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.kyc.inProgressDesc}
                </p>
                {kycStatus.session_id && (
                  <p className="text-xs text-muted-foreground font-display font-bold uppercase tracking-widest mt-2">
                    {t.kyc.sessionId}: {kycStatus.session_id.slice(0, 8)}...
                  </p>
                )}
              </>
            )}

            {kycStatus?.verification_status === "REJECTED" && (
              <>
                <h2 className="text-lg sm:text-xl font-display font-bold uppercase text-destructive mt-2">
                  {t.kyc.rejectedTitle}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.kyc.rejectedDesc}
                </p>
                <Button
                  className="mt-4"
                  onClick={startVerification}
                  disabled={isStarting}
                >
                  {isStarting ? t.kyc.processing : t.kyc.startNewVerification}
                </Button>
              </>
            )}

            {kycStatus?.verification_status === "UNVERIFIED" && (
              <Button
                className="mt-4"
                onClick={startVerification}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.kyc.processing}
                  </>
                ) : (
                  <>
                    <IconShield className="h-4 w-4 mr-2" />
                    {t.kyc.startVerification}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-5 sm:p-7">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
          <h3 className="text-lg sm:text-xl font-display font-bold uppercase mb-5">
            {t.kyc.benefits.title}
          </h3>
          <ul className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-2xl bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                  <IconCheck className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm text-foreground">
                  {t.kyc.benefits[`item${i}` as keyof typeof t.kyc.benefits]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Requirements */}
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
          <h3 className="text-lg sm:text-xl font-display font-bold uppercase mb-5">
            {t.kyc.requirements.title}
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconId className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-foreground pt-0.5">
                {t.kyc.requirements.item1}
              </span>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconCamera className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-foreground pt-0.5">
                {t.kyc.requirements.item2}
              </span>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconSun className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-foreground pt-0.5">
                {t.kyc.requirements.item3}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
