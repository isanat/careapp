"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconContract, 
  IconUser,
  IconFamily,
  IconClock,
  IconEuro,
  IconCalendar,
  IconCheck,
  IconX,
  IconRefresh,
  IconAlertCircle,
  IconLoader2,
  IconStar,
  IconMapPin,
  IconChevronRight
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
  caregiverRate?: number;
  caregiverReviews?: number;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  PENDING_ACCEPTANCE: "bg-yellow-500",
  PENDING_PAYMENT: "bg-orange-500",
  ACTIVE: "bg-green-500",
  COMPLETED: "bg-blue-500",
  CANCELLED: "bg-red-500",
  DISPUTED: "bg-purple-500",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING_ACCEPTANCE: "Aguardando sua Resposta",
  PENDING_PAYMENT: "Aguardando Pagamento",
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  DISPUTED: "Em Disputa",
};

const serviceLabels: Record<string, string> = {
  PERSONAL_CARE: "Cuidados Pessoais",
  MEDICATION: "Administração de Medicação",
  MOBILITY: "Mobilidade",
  COMPANIONSHIP: "Companhia",
  MEAL_PREPARATION: "Preparo de Refeições",
  LIGHT_HOUSEWORK: "Tarefas Domésticas",
  TRANSPORTATION: "Transporte",
  COGNITIVE_SUPPORT: "Estimulação Cognitiva",
  NIGHT_CARE: "Cuidados Noturnos",
  PALLIATIVE_CARE: "Cuidados Paliativos",
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
  
  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProposals();
    }
  }, [status]);

  useEffect(() => {
    // Check for success message from URL
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get("message");
    if (message === "accepted") {
      setSuccessMessage("Proposta aceita com sucesso! Aguarde o pagamento da família.");
    } else if (message === "rejected") {
      setSuccessMessage("Proposta recusada.");
    }
  }, []);

  const fetchProposals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/contracts');
      if (!response.ok) {
        throw new Error("Erro ao carregar propostas");
      }
      const data = await response.json();
      
      // Filter to show only relevant contracts for caregiver
      const caregiverProposals = (data.contracts || []).filter(
        (c: Proposal) => c.status === "PENDING_ACCEPTANCE" || 
                        c.status === "PENDING_PAYMENT" || 
                        c.status === "ACTIVE" ||
                        c.status === "DRAFT"
      );
      
      setProposals(caregiverProposals);
    } catch (err: any) {
      console.error('Error fetching proposals:', err);
      setError(err.message || "Erro ao carregar propostas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setAcceptDialogOpen(true);
  };

  const handleReject = async (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const confirmAccept = async () => {
    if (!selectedProposal) return;
    
    setActionLoading(selectedProposal.id);
    try {
      const response = await fetch(`/api/contracts/${selectedProposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "accept",
          caregiverAcceptedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao aceitar proposta");
      }

      setSuccessMessage("Proposta aceita com sucesso! A família será notificada para realizar o pagamento.");
      setAcceptDialogOpen(false);
      fetchProposals();
      
      // Redirect with success message
      router.push("/app/proposals?message=accepted");
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
        body: JSON.stringify({ 
          action: "reject",
          rejectionReason: rejectReason
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao recusar proposta");
      }

      setSuccessMessage("Proposta recusada.");
      setRejectDialogOpen(false);
      fetchProposals();
      
      router.push("/app/proposals?message=rejected");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Redirect if not caregiver
  if (status === "authenticated" && session?.user?.role !== "CAREGIVER") {
    router.push("/app/dashboard");
    return null;
  }

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  // Separate proposals by status
  const pendingProposals = proposals.filter(p => p.status === "PENDING_ACCEPTANCE");
  const acceptedProposals = proposals.filter(p => p.status === "PENDING_PAYMENT" || p.status === "ACTIVE");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <IconContract className="h-6 w-6" />
              Propostas Recebidas
            </h1>
            <p className="text-muted-foreground">
              Gerencie as propostas de trabalho das famílias
            </p>
          </div>
          <Button variant="outline" onClick={fetchProposals} disabled={isLoading}>
            <IconRefresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="border-green-500/20 bg-green-500/5">
            <IconCheck className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-600">Sucesso!</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && proposals.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <IconContract className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma proposta ainda</h3>
              <p className="text-muted-foreground mb-4">
                Quando famílias enviarem propostas de trabalho, elas aparecerão aqui.
              </p>
              <Button variant="outline" asChild>
                <Link href="/app/profile">Completar meu perfil</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        {!isLoading && proposals.length > 0 && (
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Novas ({pendingProposals.length})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Aceitas ({acceptedProposals.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Proposals */}
            <TabsContent value="pending" className="mt-6 space-y-4">
              {pendingProposals.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <IconCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Nenhuma nova proposta aguardando resposta
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onAccept={() => handleAccept(proposal)}
                    onReject={() => handleReject(proposal)}
                    isLoading={actionLoading === proposal.id}
                    showActions={true}
                  />
                ))
              )}
            </TabsContent>

            {/* Accepted Proposals */}
            <TabsContent value="accepted" className="mt-6 space-y-4">
              {acceptedProposals.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <IconClock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Nenhuma proposta aceita ainda
                    </p>
                  </CardContent>
                </Card>
              ) : (
                acceptedProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    isLoading={false}
                    showActions={false}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Accept Dialog */}
        <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aceitar Proposta</DialogTitle>
              <DialogDescription>
                Você tem certeza que deseja aceitar esta proposta de trabalho?
              </DialogDescription>
            </DialogHeader>
            
            {selectedProposal && (
              <div className="py-4 space-y-3">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Família:</span>
                    <span className="font-medium">{selectedProposal.family.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor total:</span>
                    <span className="font-medium">€{(selectedProposal.totalEurCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas/semana:</span>
                    <span className="font-medium">{selectedProposal.hoursPerWeek}h</span>
                  </div>
                </div>
                
                <Alert>
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ao aceitar, a família será notificada para realizar o pagamento. 
                    O contrato só iniciará após a confirmação do pagamento.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmAccept} disabled={actionLoading !== null}>
                {actionLoading ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Aceitar Proposta
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recusar Proposta</DialogTitle>
              <DialogDescription>
                Por favor, informe o motivo da recusa (opcional).
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo da recusa (opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Horário incompatível, valor abaixo do esperado..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmReject}
                disabled={actionLoading !== null}
              >
                {actionLoading ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <IconX className="h-4 w-4 mr-2" />
                    Recusar Proposta
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

// Proposal Card Component
function ProposalCard({ 
  proposal, 
  onAccept, 
  onReject, 
  isLoading,
  showActions 
}: { 
  proposal: Proposal; 
  onAccept?: () => void;
  onReject?: () => void;
  isLoading: boolean;
  showActions: boolean;
}) {
  const hourlyRate = proposal.hourlyRateEur ? proposal.hourlyRateEur / 100 : 0;
  const totalEur = proposal.totalEurCents ? proposal.totalEurCents / 100 : 0;

  return (
    <Card className={showActions ? "border-yellow-500/20 bg-yellow-500/5" : ""}>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Main Info */}
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full shrink-0">
                <IconFamily className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{proposal.family.name}</h3>
                  <Badge className={statusColors[proposal.status]}>
                    {statusLabels[proposal.status]}
                  </Badge>
                </div>
                {proposal.family.city && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <IconMapPin className="h-3 w-3" />
                    <span>{proposal.family.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Elder Info */}
            {proposal.family.elderName && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Idoso: </span>
                  <span className="font-medium">{proposal.family.elderName}</span>
                </p>
                {proposal.family.elderNeeds && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {proposal.family.elderNeeds}
                  </p>
                )}
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Valor/Hora</p>
                <p className="font-semibold">€{hourlyRate.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Horas/Semana</p>
                <p className="font-semibold">{proposal.hoursPerWeek}h</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="font-semibold">€{totalEur.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Início</p>
                <p className="font-semibold text-sm">
                  {proposal.startDate 
                    ? new Date(proposal.startDate).toLocaleDateString('pt-PT')
                    : "A definir"
                  }
                </p>
              </div>
            </div>

            {/* Services */}
            {proposal.serviceTypes && proposal.serviceTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {proposal.serviceTypes.map((service, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {serviceLabels[service] || service}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {proposal.description && (
              <p className="text-sm text-muted-foreground">
                {proposal.description}
              </p>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
              <Button onClick={onAccept} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IconCheck className="h-4 w-4 mr-2" />
                )}
                Aceitar
              </Button>
              <Button 
                variant="outline" 
                onClick={onReject} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IconX className="h-4 w-4 mr-2" />
                )}
                Recusar
              </Button>
            </div>
          )}

          {!showActions && proposal.status === "PENDING_PAYMENT" && (
            <Alert className="mt-4 lg:mt-0 lg:w-auto">
              <IconClock className="h-4 w-4" />
              <AlertDescription>
                Aguardando pagamento da família
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
