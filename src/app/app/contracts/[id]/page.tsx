"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  IconContract,
  IconUser,
  IconCalendar,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconShield,
  IconArrowLeft,
  IconLoader2,
  IconChat,
  IconPhone,
} from "@/components/icons";
import { CONTRACT_STATUS, SERVICE_TYPES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { PaymentSection } from "@/components/contracts/payment-section";
import { ReviewSection } from "@/components/contracts/review-section";
import { WeeklyApprovalPanel } from "@/components/contracts/weekly-approval-panel";

interface ContractDetails {
  id: string;
  status: string;
  title: string;
  description: string;
  hourlyRateEur: number;
  totalHours: number;
  totalEurCents: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  serviceTypes: string[];
  hoursPerWeek: number;
  caregiverId?: string;
  familyId?: string;
  weeklyPaymentEnabled?: boolean;
  otherParty: {
    id?: string;
    name: string;
    title?: string;
    city?: string;
    email?: string;
    phone?: string;
    elderName?: string;
    elderNeeds?: string;
  };
  family?: {
    name: string;
    email?: string;
    phone?: string;
    city?: string;
    elderName?: string;
    elderNeeds?: string;
  };
  acceptance?: {
    accepted: boolean;
    familyAccepted: boolean;
    familyAcceptedAt?: string;
    caregiverAccepted: boolean;
    caregiverAcceptedAt?: string;
  };
}

const STATUS_CONFIG: Record<
  string,
  { color: string; bgColor: string; label: string }
> = {
  DRAFT: {
    color: "text-muted-foreground",
    bgColor: "bg-muted/10",
    label: "Rascunho",
  },
  PENDING_ACCEPTANCE: {
    color: "text-warning",
    bgColor: "bg-warning/10",
    label: "Aguardando Aceite",
  },
  PENDING_PAYMENT: {
    color: "text-info",
    bgColor: "bg-info/10",
    label: "Aguardando Pagamento",
  },
  ACTIVE: { color: "text-success", bgColor: "bg-success/10", label: "Ativo" },
  COMPLETED: {
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Concluido",
  },
  CANCELLED: {
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Cancelado",
  },
  DISPUTED: {
    color: "text-warning",
    bgColor: "bg-warning/10",
    label: "Em Disputa",
  },
};

// Map service type keys to readable labels
function getServiceLabel(key: string): string {
  return (SERVICE_TYPES as Record<string, string>)[key] || key;
}

// Parse description that was built from questionnaire
function parseDescription(desc: string): { label: string; value: string }[] {
  if (!desc) return [];
  return desc
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        return {
          label: line.slice(0, colonIdx).trim(),
          value: line.slice(colonIdx + 1).trim(),
        };
      }
      return { label: "", value: line.trim() };
    });
}

// Parse elderly health data (JSON string from questionnaire)
function parseElderlyData(dataStr: string): Record<string, any> | null {
  if (!dataStr) return null;
  try {
    // Check if it looks like JSON
    if (dataStr.trim().startsWith("{")) {
      return JSON.parse(dataStr);
    }
    return null;
  } catch {
    return null;
  }
}

// Format elderly data for display
function formatElderlyData(data: Record<string, any> | null) {
  if (!data) return [];

  const items: Array<{ icon?: string; label: string; value: string }> = [];

  // Mobility level
  if (data.mobilityLevel) {
    const mobilityLabel: Record<string, string> = {
      completa: "Mobilidade completa",
      parcial: "Mobilidade parcial",
      nenhuma: "Sem mobilidade",
    };
    items.push({
      label: "Mobilidade",
      value: mobilityLabel[data.mobilityLevel] || data.mobilityLevel,
    });
  }

  // Medical conditions
  if (
    data.medicalConditions &&
    Array.isArray(data.medicalConditions) &&
    data.medicalConditions.length > 0
  ) {
    const medicalLabels: Record<string, string> = {
      diabetes: "Diabetes",
      hipertensao: "Hipertensão",
      cancer: "Câncer",
      artrite: "Artrite",
      avc: "AVC",
      parkinson: "Parkinson",
      alzheimer: "Alzheimer",
      demencia: "Demência",
    };
    const conditions = data.medicalConditions
      .map((c: string) => medicalLabels[c] || c)
      .join(", ");
    items.push({
      label: "Condições Médicas",
      value: conditions,
    });
  }

  // Dietary restrictions
  if (
    data.dietaryRestrictions &&
    Array.isArray(data.dietaryRestrictions) &&
    data.dietaryRestrictions.length > 0
  ) {
    const dietaryLabels: Record<string, string> = {
      diabetes_diet: "Dieta para diabetes",
      sem_gluten: "Sem glúten",
      sem_lactose: "Sem lactose",
      vegetariana: "Vegetariana",
      vegana: "Vegana",
    };
    const restrictions = data.dietaryRestrictions
      .map((r: string) => dietaryLabels[r] || r)
      .join(", ");
    items.push({
      label: "Restrições Alimentares",
      value: restrictions,
    });
  }

  // Additional notes
  if (
    data.additionalNotes &&
    typeof data.additionalNotes === "string" &&
    data.additionalNotes.trim()
  ) {
    items.push({
      label: "Observações",
      value: data.additionalNotes,
    });
  }

  return items;
}

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const { t } = useI18n();

  const [contract, setContract] = useState<ContractDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptLiability, setAcceptLiability] = useState(false);
  const [acceptNonCircumvention, setAcceptNonCircumvention] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState<{
    hash: string;
    timestamp: string;
  } | null>(null);
  const [platformFeePercent, setPlatformFeePercent] = useState(10); // Default 10%

  useEffect(() => {
    if (status === "authenticated") {
      fetchContract();
      // Fetch dynamic platform fee percentage
      apiFetch("/api/admin/settings")
        .then((res) => (res.ok ? res.json() : { platformFeePercent: 10 }))
        .then((data) => setPlatformFeePercent(data.platformFeePercent || 10))
        .catch(() => setPlatformFeePercent(10));
    }
  }, [status, resolvedParams.id]);

  const fetchContract = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const contractsResponse = await apiFetch("/api/contracts");
      if (!contractsResponse.ok) throw new Error("Erro ao carregar contratos");

      const contractsData = await contractsResponse.json();
      const foundContract = contractsData.contracts?.find(
        (c: ContractDetails) => c.id === resolvedParams.id,
      );

      if (!foundContract) throw new Error("Contrato nao encontrado");

      try {
        const acceptanceResponse = await apiFetch(
          `/api/contracts/${resolvedParams.id}/accept`,
        );
        if (acceptanceResponse.ok) {
          const acceptanceData = await acceptanceResponse.json();
          foundContract.acceptance = acceptanceData;
        }
      } catch {
        // No acceptance data yet
      }

      setContract(foundContract);
    } catch (err: any) {
      setError(err.message || "Erro");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptContract = async () => {
    if (!contract) return;
    setIsAccepting(true);
    try {
      const response = await apiFetch(`/api/contracts/${contract.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Erro");
      }
      if (resData.digitalSignature) {
        setDigitalSignature(resData.digitalSignature);
      }
      await fetchContract();
      setShowAcceptDialog(false);
    } catch (err: any) {
      setError(err.message || "Erro");
    } finally {
      setIsAccepting(false);
    }
  };

  const isFamily = session?.user?.role === "FAMILY";
  const statusConfig = contract
    ? STATUS_CONFIG[contract.status] || {
        color: "bg-gray-500",
        label: contract.status,
      }
    : null;
  const canAccept =
    contract?.status === "PENDING_ACCEPTANCE" || contract?.status === "DRAFT";
  const userNeedsToAccept = isFamily
    ? !contract?.acceptance?.familyAccepted
    : !contract?.acceptance?.caregiverAccepted;

  // Parse financial values
  const hourlyRate = contract ? Math.round(contract.hourlyRateEur / 100) : 0;
  const totalEur = contract ? Math.round(contract.totalEurCents / 100) : 0;
  const platformFee = Math.round((totalEur * platformFeePercent) / 100);
  const caregiverReceives = totalEur - platformFee;

  // Parse description
  const descriptionParts = contract
    ? parseDescription(contract.description)
    : [];

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-8 px-4 md:px-6 lg:px-8">
        {/* Page Header - Title + Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="rounded-xl -ml-2 h-10 px-2"
          >
            <Link href="/app/contracts">
              <IconArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-0">
            {contract?.title || "Contrato de Cuidado"}
          </h1>
          {statusConfig && (
            <Badge
              className={`text-[9px] font-display font-bold rounded-lg uppercase tracking-widest px-2.5 py-1 ml-auto ${statusConfig.bgColor} ${statusConfig.color} border border-${statusConfig.color.replace("text-", "")}/30`}
            >
              {statusConfig.label}
            </Badge>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-6">
            <div className="animate-pulse h-32 bg-secondary rounded-3xl" />
            <div className="animate-pulse h-64 bg-secondary rounded-3xl" />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex items-start gap-3 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl">
            <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {contract && !isLoading && (
          <>
            {/* Contract Info Card */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                Informações do Contrato
              </h4>
              <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <IconContract className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      Contrato #{contract.id.slice(-8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Criado em{" "}
                      {new Date(contract.createdAt).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Other Party Info */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                {isFamily ? "Cuidador(a)" : "Família"}
              </h4>
              <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-sm flex-shrink-0">
                    {contract.otherParty?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-foreground uppercase text-sm">
                      {contract.otherParty?.name}
                    </p>
                    {contract.otherParty?.title && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {contract.otherParty.title}
                      </p>
                    )}
                    {contract.otherParty?.city && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {contract.otherParty.city}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="rounded-xl h-9 w-9 p-0 flex-shrink-0"
                  >
                    <Link
                      href={`/app/chat?userId=${contract.otherParty?.id || ""}`}
                      title="Enviar mensagem"
                    >
                      <IconChat className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {/* Elder info (for caregiver view) */}
                {!isFamily && contract.family && (
                  <div className="pt-5 border-t border-border/50 space-y-3">
                    {contract.family.elderName && (
                      <div className="flex justify-between items-start py-3 border-b border-border/50">
                        <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                          Idoso(a)
                        </span>
                        <span className="font-display font-black text-foreground text-sm">
                          {contract.family.elderName}
                        </span>
                      </div>
                    )}

                    {/* Formatted health data */}
                    {contract.family.elderNeeds &&
                      (() => {
                        const elderData = parseElderlyData(
                          contract.family.elderNeeds,
                        );
                        const formattedData = formatElderlyData(elderData);
                        return formattedData.length > 0
                          ? formattedData.map((item, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-start py-3 border-b border-border/50"
                              >
                                <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                                  {item.label}
                                </span>
                                <span className="text-sm text-foreground text-right">
                                  {item.value}
                                </span>
                              </div>
                            ))
                          : null;
                      })()}

                    {contract.family.phone && (
                      <div className="flex items-center gap-3 pt-3">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {contract.family.phone}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Service Details Card */}
            {contract.serviceTypes &&
              contract.serviceTypes.length > 0 &&
              contract.serviceTypes[0] !== "" && (
                <section className="space-y-4">
                  <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                    Serviços
                  </h4>
                  <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
                    <div className="flex flex-wrap gap-2">
                      {contract.serviceTypes.map((service, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-[10px] font-display font-bold rounded-lg uppercase tracking-widest bg-primary/10 text-primary"
                        >
                          {getServiceLabel(service)}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              )}

            {/* Care Details Card */}
            {descriptionParts.length > 0 && (
              <section className="space-y-4">
                <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                  Detalhes do Cuidado
                </h4>
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-4">
                  {descriptionParts.map((part, i) => (
                    <div
                      key={i}
                      className={
                        i !== descriptionParts.length - 1
                          ? "pb-4 border-b border-border/50"
                          : ""
                      }
                    >
                      {part.label ? (
                        <div>
                          <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                            {part.label}
                          </span>
                          <p className="text-sm text-foreground mt-2">
                            {part.value}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground">{part.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Schedule Card */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                Horário
              </h4>
              <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
                <div className="space-y-4">
                  {contract.hoursPerWeek > 0 && (
                    <div className="flex justify-between items-center py-4 border-b border-border/50">
                      <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Horas/semana
                      </span>
                      <span className="text-lg sm:text-xl font-display font-black tracking-tighter text-foreground">
                        {contract.hoursPerWeek}h
                      </span>
                    </div>
                  )}
                  {contract.totalHours > 0 && (
                    <div className="flex justify-between items-center py-4 border-b border-border/50">
                      <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Total mensal
                      </span>
                      <span className="text-lg sm:text-xl font-display font-black tracking-tighter text-foreground">
                        {contract.totalHours}h
                      </span>
                    </div>
                  )}
                  {contract.startDate && (
                    <div className="flex justify-between items-center py-4 border-b border-border/50">
                      <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Início
                      </span>
                      <span className="font-medium text-foreground">
                        {new Date(contract.startDate).toLocaleDateString(
                          "pt-PT",
                        )}
                      </span>
                    </div>
                  )}
                  {contract.endDate && (
                    <div className="flex justify-between items-center py-4">
                      <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Término
                      </span>
                      <span className="font-medium text-foreground">
                        {new Date(contract.endDate).toLocaleDateString("pt-PT")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Financial Card */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                Valores Financeiros
              </h4>
              <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-4 border-b border-border/50">
                    <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                      Valor por hora
                    </span>
                    <span className="text-lg sm:text-xl font-display font-black tracking-tighter text-foreground">
                      €{hourlyRate}/h
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-border/50">
                    <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                      Total mensal ({contract.totalHours}h)
                    </span>
                    <span className="text-lg sm:text-xl font-display font-black tracking-tighter text-foreground">
                      €{totalEur}
                    </span>
                  </div>
                  {!isFamily && (
                    <>
                      <div className="py-4 border-t-2 border-border/50">
                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                          <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                            Taxa plataforma ({platformFeePercent}%)
                          </span>
                          <span className="text-base font-display font-black tracking-tighter text-destructive">
                            -€{platformFee}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-4">
                          <span className="text-sm font-display font-bold text-foreground uppercase tracking-widest">
                            Você recebe
                          </span>
                          <span className="text-lg sm:text-xl font-display font-black tracking-tighter text-success">
                            €{caregiverReceives}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Acceptance Status */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                Status de Aceite
              </h4>
              <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-4 border-b border-border/50">
                    <span className="text-sm font-display font-bold text-foreground uppercase tracking-widest">
                      Família
                    </span>
                    {contract.acceptance?.familyAccepted ? (
                      <span className="text-[9px] font-display font-bold rounded-lg uppercase tracking-widest px-2.5 py-1 bg-success/10 text-success border border-success/30 flex items-center gap-1.5">
                        <IconCheck className="h-3 w-3" /> Aceito
                      </span>
                    ) : (
                      <span className="text-[9px] font-display font-bold rounded-lg uppercase tracking-widest px-2.5 py-1 bg-warning/10 text-warning border border-warning/30">
                        Pendente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <span className="text-sm font-display font-bold text-foreground uppercase tracking-widest">
                      Cuidador(a)
                    </span>
                    {contract.acceptance?.caregiverAccepted ? (
                      <span className="text-[9px] font-display font-bold rounded-lg uppercase tracking-widest px-2.5 py-1 bg-success/10 text-success border border-success/30 flex items-center gap-1.5">
                        <IconCheck className="h-3 w-3" /> Aceito
                      </span>
                    ) : (
                      <span className="text-[9px] font-display font-bold rounded-lg uppercase tracking-widest px-2.5 py-1 bg-warning/10 text-warning border border-warning/30">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
                {(contract.acceptance?.familyAcceptedAt ||
                  contract.acceptance?.caregiverAcceptedAt) && (
                  <div className="pt-4 border-t border-border/50 space-y-2">
                    {contract.acceptance?.familyAcceptedAt && (
                      <p className="text-xs text-muted-foreground">
                        Família aceitou em{" "}
                        {new Date(
                          contract.acceptance.familyAcceptedAt,
                        ).toLocaleString("pt-PT")}
                      </p>
                    )}
                    {contract.acceptance?.caregiverAcceptedAt && (
                      <p className="text-xs text-muted-foreground">
                        Cuidador aceitou em{" "}
                        {new Date(
                          contract.acceptance.caregiverAcceptedAt,
                        ).toLocaleString("pt-PT")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Digital Signature Confirmation */}
            {digitalSignature && (
              <section className="space-y-4">
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-success/30 shadow-card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center flex-shrink-0">
                      <IconShield className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-display font-black text-foreground uppercase">
                        Assinatura Digital Registrada
                      </h3>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-start py-3 border-b border-border/50">
                          <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                            Hash
                          </span>
                          <span className="text-sm font-mono text-foreground">
                            {digitalSignature.hash.slice(0, 16)}...
                            {digitalSignature.hash.slice(-8)}
                          </span>
                        </div>
                        <div className="flex justify-between items-start py-3">
                          <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                            Data
                          </span>
                          <span className="text-sm text-foreground">
                            {new Date(
                              digitalSignature.timestamp,
                            ).toLocaleString("pt-PT")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Non-Circumvention Notice */}
            {contract.acceptance?.familyAccepted &&
              contract.acceptance?.caregiverAccepted && (
                <section className="space-y-4">
                  <div className="bg-card rounded-3xl p-5 sm:p-7 border border-warning/30 shadow-card">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <IconContract className="h-5 w-5 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-display font-black text-foreground uppercase">
                          Cláusula de Não-Circunvenção Ativa
                        </h3>
                        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                          Ambas as partes concordaram em manter a relação
                          profissional exclusivamente através da plataforma por
                          24 meses. Todos os pagamentos e comunicações devem ser
                          realizados pela plataforma.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

            {/* Accept Action */}
            {canAccept && userNeedsToAccept && (
              <section className="space-y-6">
                {/* Main action card */}
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-primary/30 shadow-card">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconContract className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-display font-black text-foreground uppercase">
                        Revisar & Aceitar Contrato
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        Certifique-se de que todos os detalhes estão corretos
                        antes de confirmar. Seu aceite será registrado
                        digitalmente com data, hora e IP.
                      </p>
                    </div>
                  </div>

                  {/* Summary of key contract details */}
                  <div className="grid grid-cols-2 gap-4 p-5 bg-secondary rounded-2xl mb-6 border border-border/50">
                    <div>
                      <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Valor/Hora
                      </p>
                      <p className="text-lg font-display font-black text-foreground mt-2 tracking-tighter">
                        €{hourlyRate}/h
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Total Mensal
                      </p>
                      <p className="text-lg font-display font-black text-foreground mt-2 tracking-tighter">
                        €{totalEur}
                      </p>
                    </div>
                    {!isFamily && (
                      <>
                        <div>
                          <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                            Você Recebe
                          </p>
                          <p className="text-lg font-display font-black text-success mt-2 tracking-tighter">
                            €{caregiverReceives}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                            Taxa Plataforma
                          </p>
                          <p className="text-lg font-display font-black text-destructive mt-2 tracking-tighter">
                            €{platformFee}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      className="flex-1 h-12 text-base font-semibold rounded-2xl"
                      onClick={() => setShowAcceptDialog(true)}
                      disabled={isAccepting}
                    >
                      <IconCheck className="h-5 w-5 mr-2" />
                      Aceitar Contrato
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 h-12 text-base font-semibold rounded-2xl"
                      asChild
                    >
                      <Link
                        href={`/app/chat?userId=${contract.otherParty?.id || ""}`}
                      >
                        <IconChat className="h-5 w-5 mr-2" />
                        Fazer Pergunta
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Decline option */}
                <div className="text-center">
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl"
                    asChild
                  >
                    <Link href="/app/contracts">Não aceitar agora</Link>
                  </Button>
                </div>
              </section>
            )}

            {/* Payment Section */}
            {contract.status === "PENDING_PAYMENT" && isFamily && (
              <PaymentSection
                contractId={contract.id}
                onPaymentSuccess={fetchContract}
              />
            )}

            {/* Weekly Payment Approvals */}
            {contract.status === "ACTIVE" && contract.weeklyPaymentEnabled && (
              <section className="space-y-4">
                <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                  Aprovações Semanais
                </h4>
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
                  <WeeklyApprovalPanel
                    contractId={contract.id}
                    isFamily={isFamily}
                  />
                </div>
              </section>
            )}

            {/* Active Contract: Payments & Receipts */}
            {contract.status === "ACTIVE" &&
              isFamily &&
              !contract.weeklyPaymentEnabled && (
                <ActiveContractActions contractId={contract.id} />
              )}

            {/* Review Section */}
            {contract.status === "COMPLETED" &&
              isFamily &&
              session?.user?.id &&
              contract.caregiverId && (
                <ReviewSection
                  contractId={contract.id}
                  caregiverUserId={contract.caregiverId}
                  currentUserId={session.user.id}
                />
              )}
          </>
        )}

        {/* Accept Confirmation Dialog */}
        <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <DialogContent className="max-w-md border-2 border-success/20 bg-surface">
            <DialogHeader className="pb-4 border-b border-border/30">
              <DialogTitle className="text-base font-display font-bold uppercase tracking-widest">
                Confirmar Aceite do Contrato
              </DialogTitle>
              <DialogDescription className="text-sm mt-2">
                Ao aceitar, você concorda com todos os termos legais
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 py-4">
              <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-muted/30 rounded-lg transition-colors">
                <Checkbox
                  checked={acceptTerms}
                  onCheckedChange={(c) => setAcceptTerms(c === true)}
                  className="mt-1"
                />
                <span className="text-sm leading-relaxed">
                  Li e concordo com todos os detalhes do contrato, incluindo
                  valores, horários e responsabilidades descritas.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-muted/30 rounded-lg transition-colors">
                <Checkbox
                  checked={acceptLiability}
                  onCheckedChange={(c) => setAcceptLiability(c === true)}
                  className="mt-1"
                />
                <span className="text-sm leading-relaxed">
                  Entendo que a plataforma atua como intermediária e não é
                  responsável pela qualidade ou resultado dos serviços.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 bg-amber-100/20 hover:bg-amber-100/30 border border-amber-200/50 rounded-lg transition-all">
                <Checkbox
                  checked={acceptNonCircumvention}
                  onCheckedChange={(c) => setAcceptNonCircumvention(c === true)}
                  className="mt-1"
                />
                <span className="text-sm leading-relaxed">
                  <span className="font-semibold text-amber-700">
                    Cláusula de Não-Circunvenção:
                  </span>{" "}
                  Concordo que qualquer relação profissional iniciada através
                  desta plataforma deve ser mantida por um período mínimo de 24
                  meses.
                </span>
              </label>

              <div className="flex items-start gap-2 text-xs bg-success/5 border border-success/20 p-3 rounded-lg">
                <IconShield className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  O aceite será registrado digitalmente com data, hora e
                  endereço IP.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAcceptDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90"
                onClick={handleAcceptContract}
                disabled={
                  isAccepting ||
                  !acceptTerms ||
                  !acceptLiability ||
                  !acceptNonCircumvention
                }
              >
                {isAccepting ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Aceitando...
                  </>
                ) : (
                  <>
                    <IconCheck className="h-4 w-4 mr-1.5" />
                    Confirmar Aceite
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
}

// Sub-component for active contract actions (receipts + recurring payments)
function ActiveContractActions({ contractId }: { contractId: string }) {
  const [receipts, setReceipts] = useState<
    Array<{
      id: string;
      receiptNumber: string;
      periodStart: string;
      periodEnd: string;
      hoursWorked: number;
      totalAmountCents: number;
      createdAt: string;
    }>
  >([]);
  const [recurringPayment, setRecurringPayment] = useState<{
    id: string;
    status: string;
    nextPaymentAt: string;
    amountCents: number;
  } | null>(null);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [receiptRes, rpRes] = await Promise.all([
          apiFetch(`/api/contracts/${contractId}/receipt`),
          apiFetch(`/api/payments/recurring?contractId=${contractId}`),
        ]);
        if (receiptRes.ok) {
          const data = await receiptRes.json();
          setReceipts(data.receipts || []);
        }
        if (rpRes.ok) {
          const data = await rpRes.json();
          setRecurringPayment(data.recurringPayment);
        }
      } catch {
        // silent
      } finally {
        setIsLoadingReceipts(false);
      }
    }
    load();
  }, [contractId]);

  const handleSetupRecurring = async () => {
    setIsSettingUp(true);
    try {
      const res = await apiFetch("/api/payments/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, billingDay: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecurringPayment({
          id: data.id,
          status: "ACTIVE",
          nextPaymentAt: data.nextPaymentAt,
          amountCents: data.amountCents,
        });
      }
    } catch {
      // silent
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleGenerateReceipt = async () => {
    if (hoursWorked <= 0) return;
    setIsGenerating(true);
    try {
      const now = new Date();
      const periodStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();
      const periodEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).toISOString();

      const res = await apiFetch(`/api/contracts/${contractId}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodStart, periodEnd, hoursWorked }),
      });
      if (res.ok) {
        // Refresh receipts
        const refreshRes = await apiFetch(
          `/api/contracts/${contractId}/receipt`,
        );
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setReceipts(data.receipts || []);
        }
        setHoursWorked(0);
      }
    } catch {
      // silent
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoadingReceipts) return null;

  return (
    <>
      {/* Recurring Payment */}
      <section className="space-y-4">
        <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
          Pagamento Recorrente
        </h4>
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
          {recurringPayment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-b border-border/50">
                <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                  Status
                </span>
                <Badge
                  className={
                    recurringPayment.status === "ACTIVE"
                      ? "bg-success/10 text-success border border-success/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }
                >
                  {recurringPayment.status === "ACTIVE"
                    ? "Ativo"
                    : recurringPayment.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-border/50">
                <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                  Valor mensal
                </span>
                <span className="text-lg sm:text-xl font-display font-black tracking-tighter text-foreground">
                  €{Math.round(recurringPayment.amountCents / 100)}
                </span>
              </div>
              {recurringPayment.nextPaymentAt && (
                <div className="flex items-center justify-between py-4">
                  <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                    Próximo pagamento
                  </span>
                  <span className="font-medium text-foreground">
                    {new Date(
                      recurringPayment.nextPaymentAt,
                    ).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                O pagamento é processado automaticamente pela plataforma,
                garantindo segurança para ambas as partes.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure o pagamento mensal automático para garantir que o
                cuidador receba pontualmente e a plataforma possa fornecer
                proteção contínua.
              </p>
              <Button
                onClick={handleSetupRecurring}
                disabled={isSettingUp}
                className="w-full h-12 rounded-2xl font-semibold"
              >
                {isSettingUp ? (
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IconCalendar className="h-4 w-4 mr-2" />
                )}
                Ativar Pagamento Mensal
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Receipts */}
      <section className="space-y-4">
        <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
          Recibos Fiscais
        </h4>
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
          {/* Generate receipt */}
          <div className="flex flex-col sm:flex-row items-end gap-3 mb-6 pb-6 border-b border-border/50">
            <div className="flex-1 w-full">
              <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                Horas trabalhadas este mês
              </Label>
              <Input
                type="number"
                min={0}
                max={200}
                value={hoursWorked || ""}
                onChange={(e) => setHoursWorked(Number(e.target.value) || 0)}
                placeholder="0"
                className="h-11 rounded-2xl text-sm mt-2 bg-secondary border-border"
              />
            </div>
            <Button
              onClick={handleGenerateReceipt}
              disabled={isGenerating || hoursWorked <= 0}
              className="w-full sm:w-auto h-11 rounded-2xl font-semibold"
            >
              {isGenerating ? (
                <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                "Gerar Recibo"
              )}
            </Button>
          </div>

          {receipts.length > 0 ? (
            <div className="space-y-3">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-4 bg-secondary rounded-2xl border border-border/50"
                >
                  <div>
                    <p className="text-sm font-display font-bold text-foreground">
                      {receipt.receiptNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(receipt.periodStart).toLocaleDateString(
                        "pt-PT",
                      )}{" "}
                      —{" "}
                      {new Date(receipt.periodEnd).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-display font-black text-foreground tracking-tighter">
                      €{Math.round(receipt.totalAmountCents / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {receipt.hoursWorked}h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">
              Nenhum recibo gerado ainda. Gere recibos mensalmente para fins
              fiscais.
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Recibos gerados pela plataforma são válidos para declaração de
            IRS/Segurança Social.
          </p>
        </div>
      </section>
    </>
  );
}
