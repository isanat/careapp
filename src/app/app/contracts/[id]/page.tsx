"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { CONTRACT_STATUS, SERVICE_TYPES, PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { PaymentSection } from "@/components/contracts/payment-section";
import { ReviewSection } from "@/components/contracts/review-section";

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

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  DRAFT: { color: "bg-gray-500", label: "Rascunho" },
  PENDING_ACCEPTANCE: { color: "bg-amber-500", label: "Aguardando Aceite" },
  PENDING_PAYMENT: { color: "bg-orange-500", label: "Aguardando Pagamento" },
  ACTIVE: { color: "bg-green-500", label: "Ativo" },
  COMPLETED: { color: "bg-blue-500", label: "Concluido" },
  CANCELLED: { color: "bg-red-500", label: "Cancelado" },
  DISPUTED: { color: "bg-purple-500", label: "Em Disputa" },
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

  useEffect(() => {
    if (status === "authenticated") fetchContract();
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
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro");
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
  const platformFee = Math.round(totalEur * PLATFORM_FEE_PERCENT / 100);
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
            <Badge className={`${statusConfig.color} ml-auto`}>{statusConfig.label}</Badge>
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
            <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-soft-md bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <IconContract className="h-4 w-4 opacity-60" />
                  <span className="text-xs font-medium opacity-60">Contrato #{contract.id.slice(-8)}</span>
                </div>
                <h1 className="text-lg font-bold">{contract.title || "Contrato de Cuidado"}</h1>
                <p className="text-sm opacity-70 mt-0.5">
                  Criado em {new Date(contract.createdAt).toLocaleDateString("pt-PT")}
                </p>
              </div>
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5" />
            </div>

            {/* Other Party Info */}
            <div className="bg-surface rounded-2xl border border-border/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isFamily ? "Cuidador(a)" : "Familia"}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {contract.otherParty?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{contract.otherParty?.name}</p>
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
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                  {contract.family.elderName && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Idoso(a):</span>
                      <span className="font-medium">{contract.family.elderName}</span>
                    </div>
                  )}
                  {contract.family.elderNeeds && (
                    <p className="text-sm text-muted-foreground">{contract.family.elderNeeds}</p>
                  )}
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
            <div className="bg-surface rounded-2xl border border-border/50 overflow-hidden">
              {/* Service Types */}
              {contract.serviceTypes && contract.serviceTypes.length > 0 && contract.serviceTypes[0] !== "" && (
                <div className="p-4 border-b border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Servicos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {contract.serviceTypes.map((service, i) => (
                      <Badge key={i} variant="secondary" className="rounded-lg text-xs">
                        {getServiceLabel(service)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Parsed Description Details */}
              {descriptionParts.length > 0 && (
                <div className="p-4 border-b border-border/50 space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Detalhes do Cuidado
                  </p>
                  {descriptionParts.map((part, i) => (
                    <div key={i}>
                      {part.label ? (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">{part.label}</span>
                          <p className="text-sm">{part.value}</p>
                        </div>
                      ) : (
                        <p className="text-sm">{part.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Schedule */}
              <div className="p-4 border-b border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Horario
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {contract.hoursPerWeek > 0 && (
                    <div className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Horas/semana</p>
                        <p className="text-sm font-medium">{contract.hoursPerWeek}h</p>
                      </div>
                    </div>
                  )}
                  {contract.totalHours > 0 && (
                    <div className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total mensal</p>
                        <p className="text-sm font-medium">{contract.totalHours}h</p>
                      </div>
                    </div>
                  )}
                  {contract.startDate && (
                    <div className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Inicio</p>
                        <p className="text-sm font-medium">{new Date(contract.startDate).toLocaleDateString("pt-PT")}</p>
                      </div>
                    </div>
                  )}
                  {contract.endDate && (
                    <div className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Termino</p>
                        <p className="text-sm font-medium">{new Date(contract.endDate).toLocaleDateString("pt-PT")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial */}
              <div className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Valores
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor por hora</span>
                    <span className="font-semibold">{hourlyRate}/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total mensal ({contract.totalHours}h)</span>
                    <span className="font-bold text-base">{totalEur}</span>
                  </div>
                  {!isFamily && (
                    <>
                      <div className="border-t border-border/50 pt-2 mt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Taxa plataforma ({PLATFORM_FEE_PERCENT}%)</span>
                          <span className="text-red-500">-{platformFee}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold mt-1">
                          <span>Voce recebe</span>
                          <span className="text-green-600">{caregiverReceives}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Acceptance Status */}
            <div className="bg-surface rounded-2xl border border-border/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <IconShield className="h-3.5 w-3.5 inline mr-1" />
                Status de Aceite
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Familia</span>
                  {contract.acceptance?.familyAccepted ? (
                    <Badge className="bg-green-500 text-xs">
                      <IconCheck className="h-3 w-3 mr-1" /> Aceito
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Pendente</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cuidador(a)</span>
                  {contract.acceptance?.caregiverAccepted ? (
                    <Badge className="bg-green-500 text-xs">
                      <IconCheck className="h-3 w-3 mr-1" /> Aceito
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Pendente</Badge>
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

            {/* Accept Action */}
            {canAccept && userNeedsToAccept && (
              <div className="bg-primary/5 border-2 border-primary/30 rounded-2xl p-5 text-center space-y-4">
                <IconContract className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <h3 className="font-bold text-lg">Aceitar Contrato</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Leia todos os detalhes acima antes de aceitar.
                    Seu aceite sera registrado com data, hora e IP.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-primary/25"
                  onClick={() => setShowAcceptDialog(true)}
                  disabled={isAccepting}
                >
                  <IconCheck className="h-5 w-5 mr-2" />
                  Aceitar Contrato
                </Button>
              </div>
            )}

            {/* Payment Section */}
            {contract.status === 'PENDING_PAYMENT' && isFamily && (
              <PaymentSection contractId={contract.id} onPaymentSuccess={fetchContract} />
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Aceite do Contrato</DialogTitle>
              <DialogDescription>
                Ao aceitar, voce concorda com todos os termos. Seu aceite sera registrado legalmente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={acceptTerms}
                  onCheckedChange={(c) => setAcceptTerms(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed">
                  Li e concordo com todos os detalhes do contrato, incluindo valores,
                  horarios e responsabilidades descritas.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={acceptLiability}
                  onCheckedChange={(c) => setAcceptLiability(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed">
                  Entendo que a plataforma atua como intermediaria e nao e responsavel
                  pela qualidade ou resultado dos servicos. O aceite sera registrado
                  com data, hora e endereco IP.
                </span>
              </label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAcceptContract}
                disabled={isAccepting || !acceptTerms || !acceptLiability}
              >
                {isAccepting ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aceitando...
                  </>
                ) : (
                  <>
                    <IconCheck className="h-4 w-4 mr-2" />
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
