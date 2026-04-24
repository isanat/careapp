"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
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
  BloomSectionHeader,
  BloomCard,
  BloomEmpty,
} from "@/components/bloom-custom";
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
import {
  STATUS_LABELS,
  SERVICE_TYPE_LABELS,
  getStatusBadgeVariant,
  getStatusLabel,
  getServiceTypeLabel,
} from "@/lib/status-constants";
import { tokens, cn, getCardClasses, getHeadingClasses, getBadgeClasses } from "@/lib/design-tokens";

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
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null,
  );
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
    else if (message === "countered")
      setSuccessMessage("Contraproposta enviada!");
  }, []);

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/contracts");
      if (!response.ok) throw new Error("Erro ao carregar");
      const data = await response.json();
      const caregiverProposals = (data.contracts || []).filter(
        (c: Proposal) =>
          c.status === "PENDING_ACCEPTANCE" ||
          c.status === "PENDING_PAYMENT" ||
          c.status === "ACTIVE" ||
          c.status === "DRAFT" ||
          c.status === "COUNTER_PROPOSED",
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
      const response = await apiFetch(
        `/api/contracts/${selectedProposal.id}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
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
      const response = await apiFetch(
        `/api/contracts/${selectedProposal.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejectionReason: rejectReason }),
        },
      );
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
      const newHourlyRateCents = counterHourlyRate
        ? Math.round(parseFloat(counterHourlyRate) * 100)
        : null;
      const newTotalHours = counterTotalHours
        ? parseInt(counterTotalHours)
        : null;
      const newHoursPerWeek = counterHoursPerWeek
        ? parseInt(counterHoursPerWeek)
        : null;

      if (
        newHourlyRateCents != null &&
        newHourlyRateCents !== selectedProposal.hourlyRateEur
      ) {
        body.hourlyRateEur = newHourlyRateCents;
      }
      if (
        newTotalHours != null &&
        newTotalHours !== selectedProposal.totalHours
      ) {
        body.totalHours = newTotalHours;
      }
      if (
        newHoursPerWeek != null &&
        newHoursPerWeek !== selectedProposal.hoursPerWeek
      ) {
        body.hoursPerWeek = newHoursPerWeek;
      }
      if (counterMessage.trim()) {
        body.message = counterMessage.trim();
      }

      // Validate at least one value changed
      if (!body.hourlyRateEur && !body.totalHours && !body.hoursPerWeek) {
        setError(
          "Deve alterar pelo menos um valor para enviar uma contraproposta.",
        );
        setActionLoading(null);
        return;
      }

      const response = await apiFetch(
        `/api/contracts/${selectedProposal.id}/counter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

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
  const pendingProposals = proposals.filter(
    (p) => p.status === "PENDING_ACCEPTANCE",
  );
  const counterProposals = proposals.filter(
    (p) => p.status === "COUNTER_PROPOSED",
  );
  const acceptedProposals = proposals.filter(
    (p) => p.status === "PENDING_PAYMENT" || p.status === "ACTIVE",
  );

  return (
    <AppShell>
      <div className={tokens.layout.sectionSpacing}>
        {/* Page Heading */}
        <div className={cn("flex items-center gap-3 justify-between")}>
          <div className={tokens.components.sectionHeader.container}>
            <h2 className={cn(tokens.components.sectionHeader.title)}>
              Propostas
            </h2>
            <p className={tokens.components.sectionHeader.description}>
              Gerencie propostas recebidas e negociações com famílias.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchProposals}
            disabled={isLoading}
          >
            <IconRefresh
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {successMessage && (
          <div className={cn("flex items-start", tokens.spacing.gap.lg, tokens.spacing.paddingY.mobile, tokens.spacing.paddingX.mobile, "bg-success/5 border border-success/20", tokens.radius.md)}>
            <IconCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <p className={cn(tokens.typography.sizes.base, tokens.typography.weights.medium, "text-foreground")}>
              {successMessage}
            </p>
          </div>
        )}

        {error && (
          <div className={cn("flex items-start", tokens.spacing.gap.lg, tokens.spacing.paddingY.mobile, tokens.spacing.paddingX.mobile, "bg-destructive/5 border border-destructive/20", tokens.radius.md)}>
            <IconAlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className={cn(tokens.typography.sizes.base, tokens.typography.weights.medium, "text-foreground")}>{error}</p>
          </div>
        )}

        {isLoading && (
          <div className={tokens.spacing.space.base}>
            {[1, 2].map((i) => (
              <Skeleton key={i} className={cn("h-24 w-full", tokens.radius.md)} />
            ))}
          </div>
        )}

        {!isLoading && proposals.length === 0 && (
          <BloomEmpty
            icon={<IconInbox className="h-8 w-8" />}
            title="Nenhuma proposta"
            description="Comece a completar o seu perfil para receber propostas"
            action={
              <Button size="sm" asChild>
                <Link href="/app/profile">Completar Perfil</Link>
              </Button>
            }
          />
        )}

        {!isLoading && proposals.length > 0 && (
          <Tabs defaultValue="pending" className={tokens.layout.cardSpacing}>
            <TabsList className="grid w-full grid-cols-3 h-12 bg-transparent p-0 border-b border-border/60 rounded-none">
              <TabsTrigger
                value="pending"
                className={cn("h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground", tokens.typography.sizes.base, tokens.typography.weights.bold, "tracking-wide text-muted-foreground")}
              >
                Novas{" "}
                <span className={cn(tokens.typography.sizes.xs, tokens.typography.weights.black, tokens.spacing.gap.sm, tokens.spacing.padding.tight, tokens.radius.sm, "bg-primary/10 text-primary")}>
                  {pendingProposals.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="counter"
                className={cn("h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground", tokens.typography.sizes.base, tokens.typography.weights.bold, "tracking-wide text-muted-foreground")}
              >
                Contra{" "}
                <span className={cn(tokens.typography.sizes.xs, tokens.typography.weights.black, tokens.spacing.gap.sm, tokens.spacing.padding.tight, tokens.radius.sm, "bg-primary/10 text-primary")}>
                  {counterProposals.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="accepted"
                className={cn("h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground", tokens.typography.sizes.base, tokens.typography.weights.bold, "tracking-wide text-muted-foreground")}
              >
                Aceitas{" "}
                <span className={cn(tokens.typography.sizes.xs, tokens.typography.weights.black, tokens.spacing.gap.sm, tokens.spacing.padding.tight, tokens.radius.sm, "bg-primary/10 text-primary")}>
                  {acceptedProposals.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className={tokens.spacing.space.sm}>
              {pendingProposals.length === 0 ? (
                <BloomEmpty
                  icon={<IconCheck className="h-8 w-8" />}
                  title="Nenhuma nova proposta"
                  description="Aguarde novas propostas de famílias interessadas"
                />
              ) : (
                pendingProposals.map((p) => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    onAccept={() => {
                      setSelectedProposal(p);
                      setAcceptDialogOpen(true);
                    }}
                    onReject={() => {
                      setSelectedProposal(p);
                      setRejectReason("");
                      setRejectDialogOpen(true);
                    }}
                    onCounter={() => openCounterDialog(p)}
                    isLoading={actionLoading === p.id}
                    showActions
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="counter" className={tokens.spacing.space.sm}>
              {counterProposals.length === 0 ? (
                <BloomEmpty
                  icon={<IconEdit className="h-8 w-8" />}
                  title="Nenhuma contraproposta"
                  description="Aguarde respostas às contrapropostas enviadas"
                />
              ) : (
                counterProposals.map((p) => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    isLoading={false}
                    showActions={false}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="accepted" className={tokens.spacing.space.sm}>
              {acceptedProposals.length === 0 ? (
                <BloomEmpty
                  icon={<IconClock className="h-8 w-8" />}
                  title="Nenhuma proposta aceita"
                  description="Propostas aceitas e ativas aparecerão aqui"
                />
              ) : (
                acceptedProposals.map((p) => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
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
          <DialogContent className={cn("max-w-sm border border-border bg-card", tokens.radius.md)}>
            <DialogHeader className={cn("pb-4 border-b border-border/30")}>
              <DialogTitle className={cn(tokens.typography.sizes.lg, tokens.typography.weights.bold, "text-foreground")}>
                Aceitar Proposta?
              </DialogTitle>
              <DialogDescription className={cn(tokens.typography.sizes.base, "text-muted-foreground", tokens.spacing.gap.xs)}>
                {selectedProposal?.family.name} • €
                {((selectedProposal?.totalEurCents || 0) / 100).toFixed(2)}{" "}
                total
              </DialogDescription>
            </DialogHeader>
            <div className={cn(tokens.spacing.space.base, tokens.spacing.paddingY.mobile)}>
              <div className={cn(tokens.spacing.padding.normal, "bg-success/5 border border-success/20", tokens.radius.base, tokens.spacing.space.xs, tokens.typography.sizes.base)}>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horas/semana:</span>
                  <span className="font-display font-bold text-foreground">
                    {selectedProposal?.hoursPerWeek}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data de início:</span>
                  <span className="font-display font-bold text-foreground">
                    {selectedProposal?.startDate
                      ? new Date(selectedProposal.startDate).toLocaleDateString(
                          "pt-PT",
                        )
                      : "A definir"}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className={cn(tokens.spacing.gap.sm, "pt-4 border-t border-border/30")}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAcceptDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={confirmAccept}
                disabled={actionLoading !== null}
              >
                {actionLoading ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <IconCheck className="h-4 w-4 mr-1" /> Aceitar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className={cn("max-w-sm border border-border bg-card", tokens.radius.md)}>
            <DialogHeader className={cn("pb-4 border-b border-border/30")}>
              <DialogTitle className={cn(tokens.typography.sizes.lg, tokens.typography.weights.bold, "text-foreground")}>
                Recusar Proposta
              </DialogTitle>
              <DialogDescription className={cn(tokens.typography.sizes.base, "text-muted-foreground", tokens.spacing.gap.xs)}>
                Insira um motivo (opcional)
              </DialogDescription>
            </DialogHeader>
            <div className={tokens.spacing.paddingY.mobile}>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Ex: Horário incompatível, orçamento limitado..."
                className={cn(tokens.typography.sizes.base, tokens.radius.base, "border border-border bg-secondary")}
              />
            </div>
            <DialogFooter className={cn(tokens.spacing.gap.sm, "pt-4 border-t border-border/30")}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmReject}
                disabled={actionLoading !== null}
              >
                {actionLoading ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <IconX className="h-4 w-4 mr-1" /> Recusar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Counter-Proposal Dialog */}
        <Dialog open={counterDialogOpen} onOpenChange={setCounterDialogOpen}>
          <DialogContent className={cn("max-w-md border border-border bg-card", tokens.radius.lg)}>
            <DialogHeader className="pb-4 border-b border-border/30">
              <DialogTitle className={cn(tokens.typography.sizes.lg, tokens.typography.weights.bold, "text-foreground")}>
                Contraproposta
              </DialogTitle>
              <DialogDescription className={cn(tokens.typography.sizes.base, "text-muted-foreground", tokens.spacing.gap.xs)}>
                Proponha novos valores para {selectedProposal?.family.name}
              </DialogDescription>
            </DialogHeader>
            <div className={cn(tokens.spacing.space.md, tokens.spacing.paddingY.mobile)}>
              {/* Current values summary */}
              <div className={cn(tokens.spacing.padding.normal, "bg-secondary/5 border border-secondary/20", tokens.radius.base, tokens.spacing.space.sm, tokens.typography.sizes.base)}>
                <p className={cn(tokens.typography.sizes.xs, tokens.typography.weights.bold, "text-secondary uppercase tracking-widest")}>
                  Valores Atuais
                </p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa horária:</span>
                  <span className="font-display font-bold text-foreground">
                    €{((selectedProposal?.hourlyRateEur || 0) / 100).toFixed(2)}
                    /h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total horas:</span>
                  <span className="font-display font-bold text-foreground">
                    {selectedProposal?.totalHours || 0}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horas/semana:</span>
                  <span className="font-display font-bold text-foreground">
                    {selectedProposal?.hoursPerWeek || 0}h
                  </span>
                </div>
                <div className="flex justify-between border-t border-secondary/30 pt-2 font-display font-black">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="text-foreground">
                    €{((selectedProposal?.totalEurCents || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Error message if any */}
              {error && (
                <div className={cn("flex items-start", tokens.spacing.gap.sm, tokens.spacing.padding.tight, "bg-destructive/5 border border-destructive/20", tokens.radius.base)}>
                  <IconAlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className={cn(tokens.typography.sizes.xs, "text-destructive", tokens.typography.weights.medium)}>
                    {error}
                  </p>
                </div>
              )}

              {/* Counter values */}
              <div className={tokens.spacing.space.sm}>
                <div className={tokens.spacing.space.xs}>
                  <Label className={cn(tokens.typography.sizes.xs, tokens.typography.weights.bold, "text-foreground uppercase tracking-widest")}>
                    Nova Taxa Horária (€)
                  </Label>
                  <Input
                    type="number"
                    step="0.50"
                    min="0"
                    value={counterHourlyRate}
                    onChange={(e) => setCounterHourlyRate(e.target.value)}
                    placeholder="Ex: 12.50"
                    className={cn(tokens.radius.base, "border border-border bg-secondary text-sm")}
                  />
                </div>
                <div className={tokens.spacing.space.xs}>
                  <Label className={cn(tokens.typography.sizes.xs, tokens.typography.weights.bold, "text-foreground uppercase tracking-widest")}>
                    Total de Horas
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={counterTotalHours}
                    onChange={(e) => setCounterTotalHours(e.target.value)}
                    placeholder="Ex: 40"
                    className={cn(tokens.radius.base, "border border-border bg-secondary text-sm")}
                  />
                </div>
                <div className={tokens.spacing.space.xs}>
                  <Label className={cn(tokens.typography.sizes.xs, tokens.typography.weights.bold, "text-foreground uppercase tracking-widest")}>
                    Horas por Semana
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={counterHoursPerWeek}
                    onChange={(e) => setCounterHoursPerWeek(e.target.value)}
                    placeholder="Ex: 20"
                    className={cn(tokens.radius.base, "border border-border bg-secondary text-sm")}
                  />
                </div>
                <div className={tokens.spacing.space.xs}>
                  <Label className={cn(tokens.typography.sizes.xs, tokens.typography.weights.bold, "text-foreground uppercase tracking-widest")}>
                    Mensagem (Opcional)
                  </Label>
                  <Textarea
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    rows={2}
                    placeholder="Ex: Proponho um valor ligeiramente superior devido à complexidade..."
                    className={cn("text-sm", tokens.radius.base, "border border-border bg-secondary")}
                  />
                </div>
              </div>

              {/* Preview new total */}
              {counterHourlyRate && counterTotalHours && (
                <div className={cn(tokens.spacing.padding.normal, "bg-primary/5 border border-primary/20", tokens.radius.base)}>
                  <p className={cn(tokens.typography.sizes.xs, tokens.typography.weights.bold, "text-primary uppercase tracking-widest", tokens.spacing.gap.sm)}>
                    Novo Valor Total Estimado
                  </p>
                  <p className={cn("font-display font-black text-2xl text-primary")}>
                    €
                    {(
                      parseFloat(counterHourlyRate) *
                      parseInt(counterTotalHours || "0")
                    ).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className={cn(tokens.spacing.gap.sm, "pt-4 border-t border-border/30")}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCounterDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={confirmCounter}
                disabled={actionLoading !== null}
              >
                {actionLoading ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <IconEdit className="h-4 w-4 mr-1" /> Enviar
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

function ProposalCard({
  proposal,
  onAccept,
  onReject,
  onCounter,
  isLoading,
  showActions,
}: {
  proposal: Proposal;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
  isLoading: boolean;
  showActions: boolean;
}) {
  const totalEur = proposal.totalEurCents ? proposal.totalEurCents / 100 : 0;

  return (
    <BloomCard
      variant="interactive"
      className={cn("flex flex-col md:flex-row items-start md:items-center justify-between", tokens.spacing.gap.lg, tokens.spacing.padding.card, tokens.radius.lg)}
    >
      {/* Left side: Family info */}
      <div className="flex-1 flex items-start gap-3 sm:gap-4 min-w-0">
        <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
          <IconFamily className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base sm:text-lg font-display font-black text-foreground truncate uppercase tracking-tight">
            {proposal.family.name}
          </h4>
          {proposal.family.city && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mt-1">
              <IconMapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{proposal.family.city}</span>
            </div>
          )}
          {proposal.serviceTypes && proposal.serviceTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {proposal.serviceTypes.slice(0, 2).map((s, i) => (
                <span
                  key={i}
                  className="text-[9px] font-display font-black bg-secondary rounded-2xl text-secondary-foreground border border-border/50 px-2 py-1 uppercase tracking-widest"
                >
                  {getServiceTypeLabel(s)}
                </span>
              ))}
              {proposal.serviceTypes.length > 2 && (
                <span className="text-[9px] font-display font-black bg-secondary rounded-2xl text-secondary-foreground border border-border/50 px-2 py-1 uppercase tracking-widest">
                  +{proposal.serviceTypes.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Info + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full md:w-auto md:text-right">
        {/* Stats */}
        <div className="flex gap-4 sm:gap-6 w-full sm:w-auto">
          <div>
            <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
              Taxa/h
            </p>
            <p className="text-base sm:text-lg font-display font-black text-foreground mt-1">
              €{(proposal.hourlyRateEur / 100).toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
              Horas
            </p>
            <p className="text-base sm:text-lg font-display font-black text-foreground mt-1">
              {proposal.hoursPerWeek}h
            </p>
          </div>
          <div>
            <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
              Total
            </p>
            <p className="text-base sm:text-lg font-display font-black text-foreground mt-1">
              €{totalEur.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Date */}
        <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
          {proposal.startDate
            ? new Date(proposal.startDate).toLocaleDateString("pt-PT")
            : "A definir"}
        </div>

        {/* Status Badge */}
        <span
          className={`text-[10px] font-display font-black rounded-2xl sm:rounded-3xl uppercase tracking-widest px-2.5 py-1 border shrink-0 ${getStatusBadgeVariant(proposal.status)}`}
        >
          {getStatusLabel(proposal.status)}
        </span>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={onAccept}
              disabled={isLoading}
              className="flex items-center justify-center"
            >
              {isLoading ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <IconCheck className="h-4 w-4 mr-1" />
                  Aceitar
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCounter}
              disabled={isLoading}
              title="Contraproposta"
              className="flex items-center justify-center"
            >
              <IconEdit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={isLoading}
              className="text-destructive hover:text-destructive hover:bg-destructive/5 flex items-center justify-center"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!showActions && proposal.status === "COUNTER_PROPOSED" && (
          <span className="text-[9px] font-display font-bold bg-secondary/10 text-secondary rounded-lg px-2.5 py-1 uppercase tracking-widest border border-secondary/30">
            Aguard. resposta
          </span>
        )}
      </div>
    </BloomCard>
  );
}
