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
import { AppShell } from "@/components/layout/app-shell";
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

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  DRAFT: { color: "text-muted-foreground", bgColor: "bg-muted/10", label: "Rascunho" },
  PENDING_ACCEPTANCE: { color: "text-warning", bgColor: "bg-warning/10", label: "Aguardando Aceite" },
  PENDING_PAYMENT: { color: "text-info", bgColor: "bg-info/10", label: "Aguardando Pagamento" },
  ACTIVE: { color: "text-success", bgColor: "bg-success/10", label: "Ativo" },
  COMPLETED: { color: "text-primary", bgColor: "bg-primary/10", label: "Concluido" },
  CANCELLED: { color: "text-destructive", bgColor: "bg-destructive/10", label: "Cancelado" },
  DISPUTED: { color: "text-warning", bgColor: "bg-warning/10", label: "Em Disputa" },
};

// Map service type keys to readable labels
function getServiceLabel(key: string): string {
  return (SERVICE_TYPES as Record<string, string>)[key] || key;
}

// Parse description that was built from questionnaire
function parseDescription(desc: string): { label: string; value: string }[] {
  if (!desc) return [];
  return desc.split("\n").filter(Boolean).map(line => {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      return { label: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() };
    }
    return { label: "", value: line.trim() };
  });
}

// Parse elderly health data (JSON string from questionnaire)
function parseElderlyData(dataStr: string): Record<string, any> | null {
  if (!dataStr) return null;
  try {
    // Check if it looks like JSON
    if (dataStr.trim().startsWith('{')) {
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
      'completa': 'Mobilidade completa',
      'parcial': 'Mobilidade parcial',
      'nenhuma': 'Sem mobilidade'
    };
    items.push({
      label: 'Mobilidade',
      value: mobilityLabel[data.mobilityLevel] || data.mobilityLevel
    });
  }

  // Medical conditions
  if (data.medicalConditions && Array.isArray(data.medicalConditions) && data.medicalConditions.length > 0) {
    const medicalLabels: Record<string, string> = {
      'diabetes': 'Diabetes',
      'hipertensao': 'Hipertensão',
      'cancer': 'Câncer',
      'artrite': 'Artrite',
      'avc': 'AVC',
      'parkinson': 'Parkinson',
      'alzheimer': 'Alzheimer',
      'demencia': 'Demência'
    };
    const conditions = data.medicalConditions
      .map((c: string) => medicalLabels[c] || c)
      .join(', ');
    items.push({
      label: 'Condições Médicas',
      value: conditions
    });
  }

  // Dietary restrictions
  if (data.dietaryRestrictions && Array.isArray(data.dietaryRestrictions) && data.dietaryRestrictions.length > 0) {
    const dietaryLabels: Record<string, string> = {
      'diabetes_diet': 'Dieta para diabetes',
      'sem_gluten': 'Sem glúten',
      'sem_lactose': 'Sem lactose',
      'vegetariana': 'Vegetariana',
      'vegana': 'Vegana'
    };
    const restrictions = data.dietaryRestrictions
      .map((r: string) => dietaryLabels[r] || r)
      .join(', ');
    items.push({
      label: 'Restrições Alimentares',
      value: restrictions
    });
  }

  // Additional notes
  if (data.additionalNotes && typeof data.additionalNotes === 'string' && data.additionalNotes.trim()) {
    items.push({
      label: 'Observações',
      value: data.additionalNotes
    });
  }

  return items;
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [digitalSignature, setDigitalSignature] = useState<{ hash: string; timestamp: string } | null>(null);
  const [platformFeePercent, setPlatformFeePercent] = useState(10); // Default 10%

  useEffect(() => {
    if (status === "authenticated") {
      fetchContract();
      // Fetch dynamic platform fee percentage
      apiFetch('/api/admin/settings')
        .then(res => res.ok ? res.json() : { platformFeePercent: 10 })
        .then(data => setPlatformFeePercent(data.platformFeePercent || 10))
        .catch(() => setPlatformFeePercent(10));
    }
  }, [status, resolvedParams.id]);

  const fetchContract = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const contractsResponse = await apiFetch('/api/contracts');
      if (!contractsResponse.ok) throw new Error("Erro ao carregar contratos");

      const contractsData = await contractsResponse.json();
      const foundContract = contractsData.contracts?.find((c: ContractDetails) => c.id === resolvedParams.id);

      if (!foundContract) throw new Error("Contrato nao encontrado");

      try {
        const acceptanceResponse = await apiFetch(`/api/contracts/${resolvedParams.id}/accept`);
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  const statusConfig = contract ? STATUS_CONFIG[contract.status] || { color: "bg-gray-500", label: contract.status } : null;
  const canAccept = contract?.status === 'PENDING_ACCEPTANCE' || contract?.status === 'DRAFT';
  const userNeedsToAccept = isFamily
    ? !contract?.acceptance?.familyAccepted
    : !contract?.acceptance?.caregiverAccepted;

  // Parse financial values
  const hourlyRate = contract ? Math.round(contract.hourlyRateEur / 100) : 0;
  const totalEur = contract ? Math.round(contract.totalEurCents / 100) : 0;
  const platformFee = Math.round(totalEur * platformFeePercent / 100);
  const caregiverReceives = totalEur - platformFee;

  // Parse description
  const descriptionParts = contract ? parseDescription(contract.description) : [];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto pb-8 space-y-5">
        {/* Back + Status Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl -ml-2">
            <Link href="/app/contracts">
              <IconArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </Button>
          {statusConfig && (
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0 ml-auto`}>
              {statusConfig.label}
            </Badge>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <div className="animate-pulse h-24 bg-muted rounded-2xl" />
            <div className="animate-pulse h-64 bg-muted rounded-2xl" />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {contract && !isLoading && (
          <>
            {/* Contract Title Card */}
            <div className="bg-surface rounded-2xl border-2 border-primary/20 p-5">
              <div className="h-1 -mx-5 -mt-5 mb-4 rounded-t-lg bg-primary" />
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <IconContract className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Contrato #{contract.id.slice(-8)}
                  </p>
                  <h1 className="text-lg font-bold text-foreground">{contract.title || "Contrato de Cuidado"}</h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    Criado em {new Date(contract.createdAt).toLocaleDateString("pt-PT")}
                  </p>
                </div>
              </div>
            </div>

            {/* Other Party Info */}
            <div className="bg-surface rounded-2xl border-2 border-border/30 p-4 card-interactive">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isFamily ? "Cuidador(a)" : "Familia"}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {contract.otherParty?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{contract.otherParty?.name}</p>
                  {contract.otherParty?.title && (
                    <p className="text-sm text-muted-foreground">{contract.otherParty.title}</p>
                  )}
                  {contract.otherParty?.city && (
                    <p className="text-xs text-muted-foreground">{contract.otherParty.city}</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" asChild className="rounded-lg h-9 w-9 p-0">
                    <Link href={`/app/chat?userId=${contract.otherParty?.id || ""}`}>
                      <IconChat className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Elder info (for caregiver view) */}
              {!isFamily && contract.family && (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-2.5">
                  {contract.family.elderName && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Idoso(a):</span>
                      <span className="font-semibold">{contract.family.elderName}</span>
                    </div>
                  )}

                  {/* Formatted health data */}
                  {contract.family.elderNeeds && (() => {
                    const elderData = parseElderlyData(contract.family.elderNeeds);
                    const formattedData = formatElderlyData(elderData);
                    return formattedData.length > 0 ? (
                      <div className="space-y-1.5 text-sm">
                        {formattedData.map((item, i) => (
                          <div key={i}>
                            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                            <p className="text-sm">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {contract.family.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconPhone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{contract.family.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Service Details - Full description */}
            <div className="bg-surface rounded-2xl border-2 border-border/30 overflow-hidden">
              {/* Service Types */}
              {contract.serviceTypes && contract.serviceTypes.length > 0 && contract.serviceTypes[0] !== "" && (
                <div className="p-4 border-b border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Servicos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contract.serviceTypes.map((service, i) => (
                      <Badge key={i} variant="secondary" className="rounded-lg text-xs border-0 bg-secondary/20 text-secondary">
                        {getServiceLabel(service)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Parsed Description Details */}
              {descriptionParts.length > 0 && (
                <div className="p-4 border-b border-border/30 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Detalhes do Cuidado
                  </p>
                  {descriptionParts.map((part, i) => (
                    <div key={i}>
                      {part.label ? (
                        <div>
                          <span className="text-xs font-semibold text-muted-foreground">{part.label}</span>
                          <p className="text-sm text-foreground mt-0.5">{part.value}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground">{part.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Schedule */}
              <div className="p-4 border-b border-border/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Horario
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {contract.hoursPerWeek > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <IconClock className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Horas/semana</p>
                        <p className="text-sm font-medium text-foreground">{contract.hoursPerWeek}h</p>
                      </div>
                    </div>
                  )}
                  {contract.totalHours > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <IconClock className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Total mensal</p>
                        <p className="text-sm font-medium text-foreground">{contract.totalHours}h</p>
                      </div>
                    </div>
                  )}
                  {contract.startDate && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <IconCalendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Inicio</p>
                        <p className="text-sm font-medium text-foreground">{new Date(contract.startDate).toLocaleDateString("pt-PT")}</p>
                      </div>
                    </div>
                  )}
                  {contract.endDate && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <IconCalendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Termino</p>
                        <p className="text-sm font-medium text-foreground">{new Date(contract.endDate).toLocaleDateString("pt-PT")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial */}
              <div className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Valores
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor por hora</span>
                    <span className="font-semibold text-foreground">€{hourlyRate}/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total mensal ({contract.totalHours}h)</span>
                    <span className="font-bold text-base text-foreground">€{totalEur}</span>
                  </div>
                  {!isFamily && (
                    <>
                      <div className="border-t border-border/30 pt-3 mt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Taxa plataforma ({platformFeePercent}%)</span>
                          <span className="text-destructive font-medium">-€{platformFee}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold mt-2">
                          <span className="text-foreground">Voce recebe</span>
                          <span className="text-success">€{caregiverReceives}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Acceptance Status */}
            <div className="bg-surface rounded-2xl border-2 border-border/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <IconShield className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status de Aceite
                </p>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium text-foreground">Familia</span>
                  {contract.acceptance?.familyAccepted ? (
                    <Badge className="bg-success/10 text-success border-0 text-xs font-semibold">
                      <IconCheck className="h-3 w-3 mr-1" /> Aceito
                    </Badge>
                  ) : (
                    <Badge className="bg-warning/10 text-warning border-0 text-xs font-semibold">Pendente</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium text-foreground">Cuidador(a)</span>
                  {contract.acceptance?.caregiverAccepted ? (
                    <Badge className="bg-success/10 text-success border-0 text-xs font-semibold">
                      <IconCheck className="h-3 w-3 mr-1" /> Aceito
                    </Badge>
                  ) : (
                    <Badge className="bg-warning/10 text-warning border-0 text-xs font-semibold">Pendente</Badge>
                  )}
                </div>
                {contract.acceptance?.familyAcceptedAt && (
                  <p className="text-xs text-muted-foreground">
                    Familia aceitou em {new Date(contract.acceptance.familyAcceptedAt).toLocaleString("pt-PT")}
                  </p>
                )}
                {contract.acceptance?.caregiverAcceptedAt && (
                  <p className="text-xs text-muted-foreground">
                    Cuidador aceitou em {new Date(contract.acceptance.caregiverAcceptedAt).toLocaleString("pt-PT")}
                  </p>
                )}
              </div>
            </div>

            {/* Digital Signature Confirmation */}
            {digitalSignature && (
              <div className="bg-surface rounded-2xl border-2 border-success/30 p-4">
                <div className="h-1 -mx-4 -mt-4 mb-4 rounded-t-lg bg-success" />
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <IconShield className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Assinatura Digital Registrada
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hash: {digitalSignature.hash.slice(0, 16)}...{digitalSignature.hash.slice(-8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Data: {new Date(digitalSignature.timestamp).toLocaleString("pt-PT")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Non-Circumvention Notice */}
            {contract.acceptance?.familyAccepted && contract.acceptance?.caregiverAccepted && (
              <div className="bg-surface rounded-2xl border-2 border-warning/30 p-4">
                <div className="h-1 -mx-4 -mt-4 mb-4 rounded-t-lg bg-warning" />
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <IconContract className="h-5 w-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Clausula de Nao-Circunvencao Ativa
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Ambas as partes concordaram em manter a relacao profissional
                      exclusivamente atraves da plataforma por 24 meses. Todos os pagamentos
                      e comunicacoes devem ser realizados pela plataforma.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Accept Action */}
            {canAccept && userNeedsToAccept && (
              <div className="space-y-4">
                {/* Main action card */}
                <div className="bg-surface rounded-2xl border-2 border-primary/30 p-6 space-y-4">
                  <div className="h-1 -mx-6 -mt-6 mb-4 rounded-t-lg bg-primary" />
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconContract className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">Revisar & Aceitar Contrato</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Certifique-se de que todos os detalhes estão corretos antes de confirmar.
                        Seu aceite sera registrado digitalmente com data, hora e IP.
                      </p>
                    </div>
                  </div>

                  {/* Summary of key contract details */}
                  <div className="grid grid-cols-2 gap-3 my-3 p-4 bg-muted/20 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor/Hora</p>
                      <p className="text-sm font-semibold text-foreground">€{hourlyRate}/h</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Mensal</p>
                      <p className="text-sm font-semibold text-foreground">€{totalEur}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Voce Recebe</p>
                      <p className="text-sm font-semibold text-success">€{caregiverReceives}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Taxa Plataforma</p>
                      <p className="text-sm font-semibold text-foreground">€{platformFee}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      className="flex-1 h-12 text-base font-semibold rounded-xl"
                      onClick={() => setShowAcceptDialog(true)}
                      disabled={isAccepting}
                    >
                      <IconCheck className="h-5 w-5 mr-2" />
                      Aceitar Contrato
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 h-12 text-base font-semibold rounded-xl"
                      asChild
                    >
                      <Link href={`/app/chat?userId=${contract.otherParty?.id || ""}`}>
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
                    className="text-destructive hover:text-destructive hover:bg-destructive/5"
                    asChild
                  >
                    <Link href="/app/contracts">
                      Não aceitar agora
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Section */}
            {contract.status === 'PENDING_PAYMENT' && isFamily && (
              <PaymentSection contractId={contract.id} onPaymentSuccess={fetchContract} />
            )}

            {/* Weekly Payment Approvals */}
            {contract.status === 'ACTIVE' && contract.weeklyPaymentEnabled && (
              <div className="bg-surface rounded-2xl border-2 border-border/30 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <IconCalendar className="h-4 w-4 text-secondary" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Aprovações Semanais
                  </p>
                </div>
                <WeeklyApprovalPanel
                  contractId={contract.id}
                  isFamily={isFamily}
                />
              </div>
            )}

            {/* Active Contract: Payments & Receipts */}
            {contract.status === 'ACTIVE' && isFamily && !contract.weeklyPaymentEnabled && (
              <ActiveContractActions contractId={contract.id} />
            )}

            {/* Review Section */}
            {contract.status === 'COMPLETED' && isFamily && session?.user?.id && contract.caregiverId && (
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
              <DialogTitle className="text-base font-bold">Confirmar Aceite do Contrato</DialogTitle>
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
                  Li e concordo com todos os detalhes do contrato, incluindo valores,
                  horários e responsabilidades descritas.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-muted/30 rounded-lg transition-colors">
                <Checkbox
                  checked={acceptLiability}
                  onCheckedChange={(c) => setAcceptLiability(c === true)}
                  className="mt-1"
                />
                <span className="text-sm leading-relaxed">
                  Entendo que a plataforma atua como intermediária e não é responsável
                  pela qualidade ou resultado dos serviços.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 bg-amber-100/20 hover:bg-amber-100/30 border border-amber-200/50 rounded-lg transition-all">
                <Checkbox
                  checked={acceptNonCircumvention}
                  onCheckedChange={(c) => setAcceptNonCircumvention(c === true)}
                  className="mt-1"
                />
                <span className="text-sm leading-relaxed">
                  <span className="font-semibold text-amber-700">Cláusula de Não-Circunvenção:</span>{" "}
                  Concordo que qualquer relação profissional iniciada através desta plataforma
                  deve ser mantida por um período mínimo de 24 meses.
                </span>
              </label>

              <div className="flex items-start gap-2 text-xs bg-success/5 border border-success/20 p-3 rounded-lg">
                <IconShield className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">O aceite será registrado digitalmente com data, hora e endereço IP.</span>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-border/30">
              <Button variant="outline" size="sm" onClick={() => setShowAcceptDialog(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90"
                onClick={handleAcceptContract}
                disabled={isAccepting || !acceptTerms || !acceptLiability || !acceptNonCircumvention}
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
    </AppShell>
  );
}

// Sub-component for active contract actions (receipts + recurring payments)
function ActiveContractActions({ contractId }: { contractId: string }) {
  const [receipts, setReceipts] = useState<Array<{
    id: string; receiptNumber: string; periodStart: string; periodEnd: string;
    hoursWorked: number; totalAmountCents: number; createdAt: string;
  }>>([]);
  const [recurringPayment, setRecurringPayment] = useState<{
    id: string; status: string; nextPaymentAt: string; amountCents: number;
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
      const res = await apiFetch('/api/payments/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, billingDay: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecurringPayment({
          id: data.id,
          status: 'ACTIVE',
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
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const res = await apiFetch(`/api/contracts/${contractId}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart, periodEnd, hoursWorked }),
      });
      if (res.ok) {
        // Refresh receipts
        const refreshRes = await apiFetch(`/api/contracts/${contractId}/receipt`);
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
      <div className="bg-surface rounded-2xl border border-border/50 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <IconClock className="h-3.5 w-3.5 inline mr-1" />
          Pagamento Recorrente
        </p>
        {recurringPayment ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge className={recurringPayment.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}>
                {recurringPayment.status === 'ACTIVE' ? 'Ativo' : recurringPayment.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor mensal</span>
              <span className="font-semibold">{Math.round(recurringPayment.amountCents / 100)}</span>
            </div>
            {recurringPayment.nextPaymentAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Proximo pagamento</span>
                <span>{new Date(recurringPayment.nextPaymentAt).toLocaleDateString("pt-PT")}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              O pagamento e processado automaticamente pela plataforma, garantindo
              seguranca para ambas as partes.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Configure o pagamento mensal automatico para garantir que o cuidador
              receba pontualmente e a plataforma possa fornecer protecao continua.
            </p>
            <Button
              onClick={handleSetupRecurring}
              disabled={isSettingUp}
              className="w-full h-12 rounded-xl"
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

      {/* Receipts */}
      <div className="bg-surface rounded-2xl border border-border/50 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <IconContract className="h-3.5 w-3.5 inline mr-1" />
          Recibos Fiscais
        </p>

        {/* Generate receipt */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Horas trabalhadas este mes</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={hoursWorked || ''}
              onChange={(e) => setHoursWorked(Number(e.target.value) || 0)}
              placeholder="0"
              className="h-10 rounded-lg text-sm"
            />
          </div>
          <Button
            onClick={handleGenerateReceipt}
            disabled={isGenerating || hoursWorked <= 0}
            size="sm"
            className="mt-5 rounded-lg"
          >
            {isGenerating ? <IconLoader2 className="h-4 w-4 animate-spin" /> : "Gerar Recibo"}
          </Button>
        </div>

        {receipts.length > 0 ? (
          <div className="space-y-2">
            {receipts.map(receipt => (
              <div key={receipt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{receipt.receiptNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(receipt.periodStart).toLocaleDateString("pt-PT")} -
                    {" "}{new Date(receipt.periodEnd).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{Math.round(receipt.totalAmountCents / 100)}</p>
                  <p className="text-xs text-muted-foreground">{receipt.hoursWorked}h</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">
            Nenhum recibo gerado ainda. Gere recibos mensalmente para fins fiscais.
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Recibos gerados pela plataforma sao validos para declaracao de IRS/Seguranca Social.
        </p>
      </div>
    </>
  );
}
