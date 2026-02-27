"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
};

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING_ACCEPTANCE: "Aguardando",
  PENDING_PAYMENT: "Aguard. Pagamento",
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const serviceLabels: Record<string, string> = {
  PERSONAL_CARE: "Cuidados Pessoais",
  MEDICATION: "Medicação",
  MOBILITY: "Mobilidade",
  COMPANIONSHIP: "Companhia",
  MEAL_PREPARATION: "Refeições",
  LIGHT_HOUSEWORK: "Domésticas",
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
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") fetchProposals();
  }, [status]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get("message");
    if (message === "accepted") setSuccessMessage("Proposta aceita!");
    else if (message === "rejected") setSuccessMessage("Proposta recusada.");
  }, []);

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contracts');
      if (!response.ok) throw new Error("Erro ao carregar");
      const data = await response.json();
      const caregiverProposals = (data.contracts || []).filter(
        (c: Proposal) => c.status === "PENDING_ACCEPTANCE" || 
                        c.status === "PENDING_PAYMENT" || 
                        c.status === "ACTIVE" ||
                        c.status === "DRAFT"
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
      const response = await fetch(`/api/contracts/${selectedProposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", caregiverAcceptedAt: new Date().toISOString() }),
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
      const response = await fetch(`/api/contracts/${selectedProposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: rejectReason }),
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

  if (status === "authenticated" && session?.user?.role !== "CAREGIVER") {
    router.push("/app/dashboard");
    return null;
  }
  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const pendingProposals = proposals.filter(p => p.status === "PENDING_ACCEPTANCE");
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
          <Tabs defaultValue="pending" className="px-4">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="pending" className="text-xs py-1.5">
                Novas <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{pendingProposals.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs py-1.5">
                Aceitas <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{acceptedProposals.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-3 space-y-2">
              {pendingProposals.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  <IconCheck className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  Nenhuma nova proposta
                </div>
              ) : (
                pendingProposals.map((p) => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    onAccept={() => { setSelectedProposal(p); setAcceptDialogOpen(true); }}
                    onReject={() => { setSelectedProposal(p); setRejectReason(""); setRejectDialogOpen(true); }}
                    isLoading={actionLoading === p.id}
                    showActions
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="accepted" className="mt-3 space-y-2">
              {acceptedProposals.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  <IconClock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  Nenhuma proposta aceita
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
                {selectedProposal?.family.name} • €{((selectedProposal?.totalEurCents || 0) / 100).toFixed(2)} total
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Horas/sem:</span><span>{selectedProposal?.hoursPerWeek}h</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">Início:</span><span>{selectedProposal?.startDate ? new Date(selectedProposal.startDate).toLocaleDateString('pt-PT') : "A definir"}</span></div>
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
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} placeholder="Ex: Horário incompatível..." className="text-sm" />
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={confirmReject} disabled={actionLoading !== null}>
                {actionLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <><IconX className="h-4 w-4 mr-1" /> Recusar</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function ProposalCard({ proposal, onAccept, onReject, isLoading, showActions }: { 
  proposal: Proposal; 
  onAccept?: () => void;
  onReject?: () => void;
  isLoading: boolean;
  showActions: boolean;
}) {
  const totalEur = proposal.totalEurCents ? proposal.totalEurCents / 100 : 0;

  return (
    <div className={`p-3 border rounded-lg ${showActions ? "border-yellow-500/30 bg-yellow-500/5" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-primary/10 rounded-full shrink-0">
            <IconFamily className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm truncate">{proposal.family.name}</span>
              <Badge className={`${statusColors[proposal.status]} text-[10px] px-1.5 py-0`}>{statusLabels[proposal.status]}</Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              {proposal.family.city && <span className="flex items-center gap-0.5"><IconMapPin className="h-3 w-3" />{proposal.family.city}</span>}
              <span>€{totalEur.toFixed(0)}</span>
              <span>{proposal.hoursPerWeek}h/sem</span>
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="flex gap-1 shrink-0">
            <Button size="sm" className="h-7 px-2 text-xs" onClick={onAccept} disabled={isLoading}>
              {isLoading ? <IconLoader2 className="h-3 w-3 animate-spin" /> : <IconCheck className="h-3 w-3" />}
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onReject} disabled={isLoading}>
              <IconX className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        {!showActions && proposal.status === "PENDING_PAYMENT" && (
          <span className="text-[10px] text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded">Aguard. pagamento</span>
        )}
      </div>
      
      {proposal.serviceTypes && proposal.serviceTypes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {proposal.serviceTypes.slice(0, 3).map((s, i) => (
            <Badge key={i} variant="outline" className="text-[10px] px-1 py-0">{serviceLabels[s] || s}</Badge>
          ))}
          {proposal.serviceTypes.length > 3 && <span className="text-[10px] text-muted-foreground">+{proposal.serviceTypes.length - 3}</span>}
        </div>
      )}
    </div>
  );
}
