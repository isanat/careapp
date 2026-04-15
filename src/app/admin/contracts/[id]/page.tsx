"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/common/page-header";
import { StatsCard } from "@/components/admin/common/stats-card";
import { StatusBadge } from "@/components/admin/common/status-badge";
import { BloomCard } from "@/components/bloom-custom/BloomCard";
import { BloomBadge } from "@/components/bloom-custom/BloomBadge";
import { BloomSectionHeader } from "@/components/bloom-custom/BloomSectionHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconFile,
  IconUsers,
  IconEuro,
  IconCoins,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconMail,
  IconPhone,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconLoader2,
  IconSend,
  IconShield,
  IconCreditCard,
  IconEye
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { pageTransitionVariants, containerVariants, itemVariants } from "@/lib/animations";

interface ContractDetails {
  contract: {
    id: string;
    title: string;
    description?: string;
    status: string;
    totalEurCents: number;
    totalTokens: number;
    platformFeeCents: number;
    caregiverAmountCents: number;
    startDate?: string;
    endDate?: string;
    hoursPerWeek?: number;
    serviceAddress?: string;
    serviceCity?: string;
    notes?: string;
    cancellationReason?: string;
    cancelledAt?: string;
    createdAt: string;
    familyUserId: string;
    caregiverUserId: string;
    familyName: string;
    familyEmail: string;
    familyPhone?: string;
    caregiverName: string;
    caregiverEmail: string;
    caregiverPhone?: string;
  };
  acceptance?: {
    id: string;
    familyAcceptedAt?: string;
    familyIpAddress?: string;
    familyUserAgent?: string;
    caregiverAcceptedAt?: string;
    caregiverIpAddress?: string;
    caregiverUserAgent?: string;
  };
  payments: Array<{
    id: string;
    type: string;
    status: string;
    amountEurCents: number;
    provider?: string;
    providerId?: string;
    createdAt: string;
  }>;
  escrow?: {
    id: string;
    status: string;
    amountHeldCents: number;
    amountReleasedCents?: number;
    createdAt: string;
    releasedAt?: string;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    fromUserName: string;
    toUserName: string;
    createdAt: string;
  }>;
}

export default function AdminContractDetailPage() {
  return (
    <Suspense>
      <AdminContractDetailContent />
    </Suspense>
  );
}

function AdminContractDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [data, setData] = useState<ContractDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [disputeResolution, setDisputeResolution] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const defaultTab = searchParams.get("tab") || "overview";

  const fetchContract = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/admin/contracts/${params.id}`);
      if (!response.ok) {
        throw new Error("Contract not found");
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching contract:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do contrato",
        variant: "destructive",
      });
      router.push("/admin/contracts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchContract();
    }
  }, [params.id]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Erro",
        description: "Informe o motivo do cancelamento",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiFetch(`/api/admin/contracts/${params.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!response.ok) throw new Error('Failed to cancel');

      toast({
        title: "Sucesso",
        description: "Contrato cancelado com sucesso",
      });
      fetchContract();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao cancelar contrato",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDispute = async (resolution: 'favor_family' | 'favor_caregiver' | 'split') => {
    if (!disputeResolution.trim()) {
      toast({
        title: "Erro",
        description: "Informe os detalhes da resolução",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiFetch(`/api/admin/contracts/${params.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, notes: disputeResolution }),
      });

      if (!response.ok) throw new Error('Failed to resolve');

      toast({
        title: "Sucesso",
        description: "Disputa resolvida com sucesso",
      });
      fetchContract();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao resolver disputa",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (cents?: number) => {
    if (!cents) return "€0,00";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <StatusBadge status="active" />;
      case 'COMPLETED': return <StatusBadge status="completed" />;
      case 'CANCELLED': return <StatusBadge status="cancelled" />;
      case 'DISPUTED': return <StatusBadge status="disputed" />;
      case 'PENDING_ACCEPTANCE': return <StatusBadge status="pending" />;
      default: return <BloomBadge variant="secondary">{status}</BloomBadge>;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'ACTIVATION': return 'Ativação';
      case 'TOKEN_PURCHASE': return 'Compra de Tokens';
      case 'CONTRACT_FEE': return 'Taxa de Contrato';
      case 'SERVICE_PAYMENT': return 'Pagamento de Serviço';
      case 'REDEMPTION': return 'Resgate';
      default: return type;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <StatusBadge status="completed" />;
      case 'PENDING': return <StatusBadge status="pending" />;
      case 'PROCESSING': return <StatusBadge status="processing" />;
      case 'FAILED': return <StatusBadge status="failed" />;
      case 'REFUNDED': return <StatusBadge status="refunded" />;
      default: return <BloomBadge variant="secondary">{status}</BloomBadge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || !data.contract) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contrato não encontrado</p>
      </div>
    );
  }

  const { contract, acceptance, payments, escrow, reviews } = data;

  // Timeline events
  const timeline = [
    { date: contract.createdAt, event: "Contrato criado", icon: IconFile },
    ...(acceptance?.familyAcceptedAt ? [{ date: acceptance.familyAcceptedAt, event: "Família aceitou", icon: IconCheck }] : []),
    ...(acceptance?.caregiverAcceptedAt ? [{ date: acceptance.caregiverAcceptedAt, event: "Cuidador aceitou", icon: IconCheck }] : []),
    ...(contract.cancelledAt ? [{ date: contract.cancelledAt, event: "Contrato cancelado", icon: IconX }] : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      className="space-y-6"
    >
      <PageHeader
        title={contract.title}
        description={`ID: ${contract.id}`}
        breadcrumbs={[
          { label: "Contratos", href: "/admin/contracts" },
          { label: contract.title?.slice(0, 20) || "Contrato" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {getStatusBadge(contract.status)}
            <Link href="/admin/contracts">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <motion.div
        className="grid gap-4 md:grid-cols-4"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Valor Total"
            value={formatCurrency(contract.totalEurCents)}
            icon={<IconEuro className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Tokens"
            value={contract.totalTokens || 0}
            icon={<IconCoins className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Taxa Plataforma"
            value={formatCurrency(contract.platformFeeCents)}
            description="10%"
            icon={<IconShield className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Valor Cuidador"
            value={formatCurrency(contract.caregiverAmountCents)}
            description="90%"
            icon={<IconUsers className="h-5 w-5" />}
          />
        </motion.div>
      </motion.div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="parties">Partes</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          {contract.status === 'DISPUTED' && (
            <TabsTrigger value="dispute" className="text-destructive">
              <IconAlertCircle className="h-4 w-4 mr-2" />
              Disputa
            </TabsTrigger>
          )}
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <motion.div
            className="grid gap-6 lg:grid-cols-2"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {/* Contract Details */}
            <motion.div variants={itemVariants}>
              <BloomCard className="p-5 sm:p-6 md:p-7">
                <BloomSectionHeader title="Detalhes do Contrato" />
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                    <p className="mt-1">{contract.description || "Sem descrição"}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Início</p>
                      <p className="font-medium">{formatDate(contract.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Término</p>
                      <p className="font-medium">{formatDate(contract.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Horas/Semana</p>
                      <p className="font-medium">{contract.hoursPerWeek || "-"}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Criado em</p>
                      <p className="font-medium">{formatDate(contract.createdAt)}</p>
                    </div>
                  </div>

                  {(contract.serviceAddress || contract.serviceCity) && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Local do Serviço</p>
                        <div className="flex items-start gap-2">
                          <IconMapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p>{contract.serviceAddress}</p>
                            <p className="text-sm text-muted-foreground">{contract.serviceCity}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {contract.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Notas</p>
                        <p className="text-sm">{contract.notes}</p>
                      </div>
                    </>
                  )}

                  {contract.cancellationReason && (
                    <>
                      <Separator />
                      <div className="bg-destructive/10 p-3 rounded-md">
                        <p className="text-sm font-medium text-destructive">Motivo do Cancelamento</p>
                        <p className="text-sm mt-1">{contract.cancellationReason}</p>
                      </div>
                    </>
                  )}
                </div>
              </BloomCard>
            </motion.div>

            {/* Payment Breakdown */}
            <motion.div variants={itemVariants}>
              <BloomCard className="p-5 sm:p-6 md:p-7">
                <BloomSectionHeader title="Detalhamento Financeiro" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Valor Bruto</span>
                    <span className="font-medium">{formatCurrency(contract.totalEurCents)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Taxa da Plataforma (10%)</span>
                    <span className="text-destructive">-{formatCurrency(contract.platformFeeCents)}</span>
                  </div>

                  <div className="flex justify-between items-center font-medium text-lg">
                    <span>Valor Líquido (Cuidador)</span>
                    <span className="text-success">{formatCurrency(contract.caregiverAmountCents)}</span>
                  </div>

                  {escrow && (
                    <>
                      <Separator />
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-2">Escrow</p>
                        <div className="flex justify-between text-sm">
                          <span>Status</span>
                          <StatusBadge status={escrow.status.toLowerCase() as any} />
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span>Valor Retido</span>
                          <span>{formatCurrency(escrow.amountHeldCents)}</span>
                        </div>
                        {escrow.amountReleasedCents && (
                          <div className="flex justify-between text-sm mt-1">
                            <span>Valor Liberado</span>
                            <span>{formatCurrency(escrow.amountReleasedCents)}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  {(contract.status === 'ACTIVE' || contract.status === 'PENDING_ACCEPTANCE') && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Ações Administrativas</p>
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Motivo do cancelamento..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={2}
                          />
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleCancel}
                            disabled={actionLoading || !cancelReason.trim()}
                          >
                            {actionLoading ? (
                              <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <IconX className="h-4 w-4 mr-2" />
                            )}
                            Cancelar Contrato
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </BloomCard>
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* Parties Tab */}
        <TabsContent value="parties" className="space-y-6">
          <motion.div
            className="grid gap-6 md:grid-cols-2"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {/* Family */}
            <motion.div variants={itemVariants}>
              <BloomCard className="p-5 sm:p-6 md:p-7">
                <BloomSectionHeader title="Família" />
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${contract.familyName}`} />
                      <AvatarFallback>{contract.familyName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-lg">{contract.familyName}</p>
                      <p className="text-sm text-muted-foreground">Contratante</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <span>{contract.familyEmail}</span>
                    </div>
                    {contract.familyPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <span>{contract.familyPhone}</span>
                      </div>
                    )}
                  </div>

                  <Link href={`/admin/users/${contract.familyUserId}`}>
                    <Button variant="outline" className="w-full mt-2">
                      <IconEye className="h-4 w-4 mr-2" />
                      Ver Perfil Completo
                    </Button>
                  </Link>
                </div>
              </BloomCard>
            </motion.div>

            {/* Caregiver */}
            <motion.div variants={itemVariants}>
              <BloomCard className="p-5 sm:p-6 md:p-7">
                <BloomSectionHeader title="Cuidador" />
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${contract.caregiverName}`} />
                      <AvatarFallback>{contract.caregiverName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-lg">{contract.caregiverName}</p>
                      <p className="text-sm text-muted-foreground">Prestador</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <span>{contract.caregiverEmail}</span>
                    </div>
                    {contract.caregiverPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <span>{contract.caregiverPhone}</span>
                      </div>
                    )}
                  </div>

                  <Link href={`/admin/caregivers/${contract.caregiverUserId}`}>
                    <Button variant="outline" className="w-full mt-2">
                      <IconEye className="h-4 w-4 mr-2" />
                      Ver Perfil Completo
                    </Button>
                  </Link>
                </div>
              </BloomCard>
            </motion.div>
          </motion.div>

          {/* Acceptance Logs */}
          {acceptance && (
            <motion.div variants={itemVariants}>
              <BloomCard className="p-5 sm:p-6 md:p-7">
                <BloomSectionHeader title="Registro de Aceite" desc="Informações de aceite com endereço IP para conformidade legal" />
                <div className="grid gap-6 md:grid-cols-2">
                  {acceptance.familyAcceptedAt && (
                    <div className="space-y-2">
                      <p className="font-medium">Família</p>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Aceito em:</span> {formatDate(acceptance.familyAcceptedAt)}</p>
                        <p><span className="text-muted-foreground">IP:</span> <code className="text-xs bg-muted px-1 rounded">{acceptance.familyIpAddress || "-"}</code></p>
                        <p><span className="text-muted-foreground">User Agent:</span> <span className="text-xs">{acceptance.familyUserAgent?.slice(0, 50) || "-"}</span></p>
                      </div>
                    </div>
                  )}
                  {acceptance.caregiverAcceptedAt && (
                    <div className="space-y-2">
                      <p className="font-medium">Cuidador</p>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Aceito em:</span> {formatDate(acceptance.caregiverAcceptedAt)}</p>
                        <p><span className="text-muted-foreground">IP:</span> <code className="text-xs bg-muted px-1 rounded">{acceptance.caregiverIpAddress || "-"}</code></p>
                        <p><span className="text-muted-foreground">User Agent:</span> <span className="text-xs">{acceptance.caregiverUserAgent?.slice(0, 50) || "-"}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              </BloomCard>
            </motion.div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <motion.div variants={itemVariants}>
            <BloomCard className="p-5 sm:p-6 md:p-7">
              <BloomSectionHeader title={`Pagamentos Relacionados (${payments?.length || 0})`} />
              {payments && payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <IconCreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{getPaymentTypeLabel(payment.type)}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.provider || "Interno"} • {formatDate(payment.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(payment.amountEurCents)}</p>
                        <div className="mt-1">
                          {getPaymentStatusBadge(payment.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pagamento encontrado
                </p>
              )}
            </BloomCard>
          </motion.div>

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <motion.div variants={itemVariants}>
              <BloomCard className="p-5 sm:p-6 md:p-7">
                <BloomSectionHeader title={`Avaliações (${reviews.length})`} />
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{review.fromUserName} → {review.toUserName}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < review.rating ? "text-warning" : "text-muted"}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(review.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </BloomCard>
            </motion.div>
          )}
        </TabsContent>

        {/* Dispute Tab */}
        {contract.status === 'DISPUTED' && (
          <TabsContent value="dispute" className="space-y-6">
            <motion.div variants={itemVariants}>
              <BloomCard className="p-5 sm:p-6 md:p-7 border-destructive">
                <BloomSectionHeader title="Resolução de Disputa" desc="Este contrato está em disputa. Resolva a situação escolhendo uma das opções abaixo." />
                <div className="space-y-6">
                  <div className="bg-destructive/10 p-4 rounded-lg">
                    <p className="font-medium text-destructive">Contrato em Disputa</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Uma disputa foi aberta e requer intervenção administrativa para resolução.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Detalhes da Resolução</label>
                    <Textarea
                      placeholder="Descreva a resolução da disputa..."
                      value={disputeResolution}
                      onChange={(e) => setDisputeResolution(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="font-medium">Decisão</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Button
                        variant="outline"
                        className="justify-start h-auto py-4"
                        onClick={() => handleResolveDispute('favor_family')}
                        disabled={actionLoading || !disputeResolution.trim()}
                      >
                        <div className="text-left">
                          <p className="font-medium">Favor da Família</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Reembolso total para a família
                          </p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start h-auto py-4"
                        onClick={() => handleResolveDispute('favor_caregiver')}
                        disabled={actionLoading || !disputeResolution.trim()}
                      >
                        <div className="text-left">
                          <p className="font-medium">Favor do Cuidador</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Libera pagamento ao cuidador
                          </p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start h-auto py-4"
                        onClick={() => handleResolveDispute('split')}
                        disabled={actionLoading || !disputeResolution.trim()}
                      >
                        <div className="text-left">
                          <p className="font-medium">Dividir</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            50% para cada parte
                          </p>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </BloomCard>
            </motion.div>
          </TabsContent>
        )}

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <motion.div variants={itemVariants}>
            <BloomCard className="p-5 sm:p-6 md:p-7">
              <BloomSectionHeader title="Histórico de Eventos" />
              <div className="relative">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-4 pb-6 last:pb-0">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <event.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-muted" />
                      )}
                    </div>
                    <div className="pt-2">
                      <p className="font-medium">{event.event}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </BloomCard>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
