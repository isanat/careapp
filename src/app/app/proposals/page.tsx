"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/layout/app-shell";
import {
  IconContract,
  IconFamily,
  IconClock,
  IconEuro,
  IconCheck,
  IconX,
  IconRefresh,
  IconAlertCircle,
  IconLoader2,
  IconMapPin,
  IconInbox,
  IconEdit,
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

interface Proposal {
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
  family: {
    name: string;
    email?: string;
    phone?: string;
    city?: string;
    elderName?: string;
    elderNeeds?: string;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  PENDING_ACCEPTANCE: "bg-yellow-500",
  PENDING_PAYMENT: "bg-orange-500",
  ACTIVE: "bg-green-500",
  COMPLETED: "bg-blue-500",
  CANCELLED: "bg-red-500",
  COUNTER_PROPOSED: "bg-purple-500",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING_ACCEPTANCE: "Aguardando",
  PENDING_PAYMENT: "Aguard. Pagamento",
  ACTIVE: "Ativo",
  COMPLETED: "Concluido",
  CANCELLED: "Cancelado",
  COUNTER_PROPOSED: "Contraproposta",
};

const serviceLabels: Record<string, string> = {
  PERSONAL_CARE: "Cuidados Pessoais",
  MEDICATION: "Medicacao",
  MOBILITY: "Mobilidade",
  COMPANIONSHIP: "Companhia",
  MEAL_PREPARATION: "Refeicoes",
  LIGHT_HOUSEWORK: "Domesticas",
  TRANSPORTATION: "Transporte",
  COGNITIVE_SUPPORT: "Cognitiva",
  NIGHT_CARE: "Noturno",
  PALLIATIVE_CARE: "Paliativos",
  PHYSIOTHERAPY: "Fisioterapia",
  NURSING_CARE: "Enfermagem",
};

export default function ProposalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Counter-proposal form state
  const [counterHourlyRate, setCounterHourlyRate] = useState("");
  const [counterTotalHours, setCounterTotalHours] = useState("");
  const [counterHoursPerWeek, setCounterHoursPerWeek] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  useEffect(() => {
    if (status === "authenticated") fetchProposals();
  }, [status]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get("message");
    if (message === "accepted") setSuccessMessage("Proposta aceita!");
    else if (message === "rejected") setSuccessMessage("Proposta recusada.");
    else if (message === "countered") setSuccessMessage("Contraproposta enviada!");
  }, []);

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/contracts');
      if (!response.ok) throw new Error("Erro ao carregar");
      const data = await response.json();
      const caregiverProposals = (data.contracts || []).filter(
        (c: Proposal) => c.status === "PENDING_ACCEPTANCE" ||
                        c.status === "PENDING_PAYMENT" ||
                        c.status === "ACTIVE" ||
                        c.status === "DRAFT" ||
                        c.status === "COUNTER_PROPOSED"
      );
      setProposals(caregiverProposals);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAccept = async () => {
    if (!selectedProposal) return;
    setActionLoading(selectedProposal.id);
    try {
      const response = await apiFetch(`/api/contracts/${selectedProposal.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Erro ao aceitar");
      setSuccessMessage("Proposta aceita!");
      setAcceptDialogOpen(false);
      fetchProposals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async () => {
    if (!selectedProposal) return;
    setActionLoading(selectedProposal.id);
    try {
      const response = await apiFetch(`/api/contracts/${selectedProposal.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });
      if (!response.ok) throw new Error("Erro ao recusar");
      setSuccessMessage("Proposta recusada.");
      setRejectDialogOpen(false);
      fetchProposals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openCounterDialog = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    // Pre-fill with current values (convert cents to euros for display)
    setCounterHourlyRate(((proposal.hourlyRateEur || 0) / 100).toFixed(2));
    setCounterTotalHours(String(proposal.totalHours || ""));
    setCounterHoursPerWeek(String(proposal.hoursPerWeek || ""));
    setCounterMessage("");
    setCounterDialogOpen(true);
  };

  const confirmCounter = async () => {
    if (!selectedProposal) return;
    setActionLoading(selectedProposal.id);
    setError(null);
    try {
      // Build the body with only changed values (convert euros back to cents for hourlyRate)
      const body: Record<string, unknown> = {};
      const newHourlyRateCents = counterHourlyRate ? Math.round(parseFloat(counterHourlyRate) * 100) : null;
      const newTotalHours = counterTotalHours ? parseInt(counterTotalHours) : null;
      const newHoursPerWeek = counterHoursPerWeek ? parseInt(counterHoursPerWeek) : null;

      if (newHourlyRateCents != null && newHourlyRateCents !== selectedProposal.hourlyRateEur) {
        body.hourlyRateEur = newHourlyRateCents;
      }
      if (newTotalHours != null && newTotalHours !== selectedProposal.totalHours) {
        body.totalHours = newTotalHours;
      }
      if (newHoursPerWeek != null && newHoursPerWeek !== selectedProposal.hoursPerWeek) {
        body.hoursPerWeek = newHoursPerWeek;
      }
      if (counterMessage.trim()) {
        body.message = counterMessage.trim();
      }

      // Validate at least one value changed
      if (!body.hourlyRateEur && !body.totalHours && !body.hoursPerWeek) {
        setError("Deve alterar pelo menos um valor para enviar uma contraproposta.");
        setActionLoading(null);
        return;
      }

      const response = await apiFetch(`/api/contracts/${selectedProposal.id}/counter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao enviar contraproposta");
      }

      setSuccessMessage("Contraproposta enviada com sucesso!");
      setCounterDialogOpen(false);
      fetchProposals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "authenticated" && session?.user?.role !== "CAREGIVER") {
    router.push("/app/dashboard");
    return null;
  }
  const pendingProposals = proposals.filter(p => p.status === "PENDING_ACCEPTANCE");
  const counterProposals = proposals.filter(p => p.status === "COUNTER_PROPOSED");
  const acceptedProposals = proposals.filter(p => p.status === "PENDING_PAYMENT" || p.status === "ACTIVE");

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background border-b">
          <h1 className="text-lg font-semibold">Propostas</h1>
          <Button variant="ghost" size="sm" onClick={fetchProposals} disabled={isLoading}>
            <IconRefresh className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {successMessage && (
          <div className="mx-4 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm flex items-center gap-2">
            <IconCheck className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mx-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-2">
            <IconAlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {isLoading && (
          <div className="px-4 space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && proposals.length === 0 && (
          <div className="px-4 py-12 text-center">
            <IconInbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma proposta ainda</p>
            <Button variant="outline" size="sm" asChild className="mt-3">
              <Link href="/app/profile">Completar perfil</Link>
            </Button>
          </div>
        )}

        {!isLoading && proposals.length > 0 && (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 h-10 rounded-lg bg-muted p-1">
              <TabsTrigger value="pending" className="text-xs font-medium data-[state=active]:shadow-sm">
                Novas <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px] font-semibold">{pendingProposals.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="counter" className="text-xs font-medium data-[state=active]:shadow-sm">
                Contrapropostas <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px] font-semibold">{counterProposals.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs font-medium data-[state=active]:shadow-sm">
                Aceitas <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px] font-semibold">{acceptedProposals.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingProposals.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-surface rounded-xl border-2 border-dashed border-border/30">
                  <IconCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground font-medium">Nenhuma nova proposta</p>
                </div>
              ) : (
                pendingProposals.map((p) => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    onAccept={() => { setSelectedProposal(p); setAcceptDialogOpen(true); }}
                    onReject={() => { setSelectedProposal(p); setRejectReason(""); setRejectDialogOpen(true); }}
                    onCounter={() => openCounterDialog(p)}
                    isLoading={actionLoading === p.id}
                    showActions
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="counter" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {counterProposals.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-surface rounded-xl border-2 border-dashed border-border/30">
                  <IconEdit className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground font-medium">Nenhuma contraproposta enviada</p>
                </div>
              ) : (
                counterProposals.map((p) => (
                  <ProposalCard key={p.id} proposal={p} isLoading={false} showActions={false} />
                ))
              )}
            </TabsContent>

            <TabsContent value="accepted" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedProposals.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-surface rounded-xl border-2 border-dashed border-border/30">
                  <IconClock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground font-medium">Nenhuma proposta aceita</p>
                </div>
              ) : (
                acceptedProposals.map((p) => (
                  <ProposalCard key={p.id} proposal={p} isLoading={false} showActions={false} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Accept Dialog */}
        <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Aceitar Proposta?</DialogTitle>
              <DialogDescription className="text-sm">
                {selectedProposal?.family.name} -- €{((selectedProposal?.totalEurCents || 0) / 100).toFixed(2)} total
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Horas/sem:</span><span>{selectedProposal?.hoursPerWeek}h</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">Inicio:</span><span>{selectedProposal?.startDate ? new Date(selectedProposal.startDate).toLocaleDateString('pt-PT') : "A definir"}</span></div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setAcceptDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={confirmAccept} disabled={actionLoading !== null}>
                {actionLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <><IconCheck className="h-4 w-4 mr-1" /> Aceitar</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Recusar Proposta</DialogTitle>
              <DialogDescription className="text-sm">Motivo (opcional)</DialogDescription>
            </DialogHeader>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} placeholder="Ex: Horario incompativel..." className="text-sm" />
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={confirmReject} disabled={actionLoading !== null}>
                {actionLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <><IconX className="h-4 w-4 mr-1" /> Recusar</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Counter-Proposal Dialog */}
        <Dialog open={counterDialogOpen} onOpenChange={setCounterDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Contraproposta</DialogTitle>
              <DialogDescription className="text-sm">
                Proponha novos valores para {selectedProposal?.family.name}. Altere apenas os campos que deseja modificar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Current values summary */}
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="text-xs font-medium text-muted-foreground mb-2">Valores atuais</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa horaria:</span>
                  <span>€{((selectedProposal?.hourlyRateEur || 0) / 100).toFixed(2)}/h</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Total horas:</span>
                  <span>{selectedProposal?.totalHours || 0}h</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Horas/semana:</span>
                  <span>{selectedProposal?.hoursPerWeek || 0}h</span>
                </div>
                <div className="flex justify-between mt-1 font-medium">
                  <span className="text-muted-foreground">Total:</span>
                  <span>€{((selectedProposal?.totalEurCents || 0) / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Counter values */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Nova taxa horaria (€)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    min="0"
                    value={counterHourlyRate}
                    onChange={(e) => setCounterHourlyRate(e.target.value)}
                    placeholder="Ex: 12.50"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Total de horas</Label>
                  <Input
                    type="number"
                    min="1"
                    value={counterTotalHours}
                    onChange={(e) => setCounterTotalHours(e.target.value)}
                    placeholder="Ex: 40"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Horas por semana</Label>
                  <Input
                    type="number"
                    min="1"
                    value={counterHoursPerWeek}
                    onChange={(e) => setCounterHoursPerWeek(e.target.value)}
                    placeholder="Ex: 20"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Mensagem (opcional)</Label>
                  <Textarea
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    rows={2}
                    placeholder="Ex: Proponho um valor ligeiramente superior devido a complexidade dos cuidados..."
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              {/* Preview new total */}
              {counterHourlyRate && counterTotalHours && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm">
                  <p className="text-xs font-medium text-purple-600 mb-1">Novo valor total estimado</p>
                  <p className="font-semibold text-purple-700">
                    €{(parseFloat(counterHourlyRate) * parseInt(counterTotalHours || "0")).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setCounterDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={confirmCounter} disabled={actionLoading !== null}>
                {actionLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <><IconEdit className="h-4 w-4 mr-1" /> Enviar Contraproposta</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function ProposalCard({ proposal, onAccept, onReject, onCounter, isLoading, showActions }: {
  proposal: Proposal;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
  isLoading: boolean;
  showActions: boolean;
}) {
  const totalEur = proposal.totalEurCents ? proposal.totalEurCents / 100 : 0;

  const statusColorMap: Record<string, string> = {
    PENDING_ACCEPTANCE: "border-amber-200/50 hover:border-amber-300/60",
    COUNTER_PROPOSED: "border-secondary/30 hover:border-secondary/50",
    PENDING_PAYMENT: "border-orange-200/50 hover:border-orange-300/60",
    ACTIVE: "border-success/30 hover:border-success/50",
    COMPLETED: "border-primary/30 hover:border-primary/50",
    CANCELLED: "border-error/30 hover:border-error/50",
  };

  const borderClass = statusColorMap[proposal.status] || "border-border/40 hover:border-border/60";

  return (
    <div className={`bg-surface rounded-xl p-5 border-2 ${borderClass} transition-all duration-300 card-interactive flex flex-col h-full`}>
      {/* Top color indicator */}
      <div className={`h-1 -mx-5 -mt-5 mb-4 rounded-t-lg ${
        showActions ? "bg-amber-500" :
        proposal.status === "COUNTER_PROPOSED" ? "bg-secondary" :
        proposal.status === "PENDING_PAYMENT" ? "bg-orange-500" :
        proposal.status === "ACTIVE" ? "bg-success" :
        proposal.status === "COMPLETED" ? "bg-primary" :
        "bg-border"
      }`} />

      {/* Header: Family info + Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 bg-primary/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <IconFamily className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">{proposal.family.name}</h3>
            {proposal.family.city && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <IconMapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{proposal.family.city}</span>
              </div>
            )}
          </div>
        </div>
        <Badge className={`${statusColors[proposal.status]} text-white text-[11px] px-2.5 py-0.5 font-semibold shrink-0`}>
          {statusLabels[proposal.status]}
        </Badge>
      </div>

      {/* Service types */}
      {proposal.serviceTypes && proposal.serviceTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {proposal.serviceTypes.slice(0, 2).map((s, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] font-medium px-2 py-0.5 h-auto bg-secondary/10">
              {serviceLabels[s] || s}
            </Badge>
          ))}
          {proposal.serviceTypes.length > 2 && (
            <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 h-auto bg-secondary/10">
              +{proposal.serviceTypes.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/30 mb-3">
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground font-medium">Taxa</p>
          <p className="text-sm font-bold text-success">€{(proposal.hourlyRateEur / 100).toFixed(0)}/h</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground font-medium">Horas</p>
          <p className="text-sm font-bold text-primary">{proposal.hoursPerWeek}h</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground font-medium">Total</p>
          <p className="text-sm font-bold text-foreground">€{totalEur.toFixed(0)}</p>
        </div>
      </div>

      {/* Date info */}
      <div className="text-xs text-muted-foreground mb-3 font-medium">
        Início: {proposal.startDate ? new Date(proposal.startDate).toLocaleDateString('pt-PT') : "A definir"}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 mt-auto pt-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            onClick={onAccept}
            disabled={isLoading}
          >
            {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <><IconCheck className="h-4 w-4 mr-1" /> Aceitar</>}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCounter}
            disabled={isLoading}
            title="Contraproposta"
          >
            <IconEdit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-error hover:text-error"
            onClick={onReject}
            disabled={isLoading}
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!showActions && proposal.status === "COUNTER_PROPOSED" && (
        <div className="mt-auto pt-2 text-center">
          <Badge variant="secondary" className="text-[10px] bg-secondary/15 text-secondary">Aguard. resposta</Badge>
        </div>
      )}
    </div>
  );
}
