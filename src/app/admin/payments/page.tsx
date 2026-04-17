"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/common/page-header";
import { StatsCard } from "@/components/admin/common/stats-card";
import { BloomCard } from "@/components/bloom-custom/BloomCard";
import { BloomBadge } from "@/components/bloom-custom/BloomBadge";
import { BloomSectionHeader } from "@/components/bloom-custom/BloomSectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconCreditCard,
  IconRefresh,
  IconExternalLink,
  IconCoin,
  IconTrendingUp,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconSearch,
  IconLoader2,
  IconAlertCircle,
  IconArrowUp,
  IconArrowDown,
  IconUser,
  IconWallet,
  IconContract,
  IconEuro,
  IconShield,
} from "@/components/icons";
import { StatusBadge } from "@/components/admin/common/status-badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

// ==================== TYPES ====================

interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  status: string;
  provider: string;
  amountEurCents: number;
  contractId: string | null;
  contractTitle: string | null;
  createdAt: string;
  paidAt: string | null;
  refundedAt: string | null;
  stripePaymentIntentId: string | null;
}

interface PaymentStats {
  today: number;
  thisMonth: number;
  pendingRefunds: number;
  totalRevenue: number;
}

interface AuditData {
  user: { id: string; email: string; name: string; role: string; status: string; phone: string | null; nif: string | null; createdAt: string };
  wallet: { balanceEurCents: number };
  summary: {
    totalDeposits: number; depositFees: number; depositTokens: number;
    totalWithdrawals: number; withdrawalFees: number;
    totalContractFees: number; contractFeePlatform: number;
    totalServicePayments: number; servicePaymentFees: number;
    totalPlatformFees: number; pendingAmount: number; failedAmount: number;
    refundedAmount: number; totalTransactions: number; completedTransactions: number;
  };
  tipsSent: { total: number; qty: number };
  tipsReceived: { total: number; qty: number };
  crossCheck: {
    totalIn: number; totalOut: number; totalFees: number; totalRefunded: number;
    tipsSent: number; tipsReceived: number;
    expectedBalance: number; actualBalance: number; difference: number; isConsistent: boolean;
  };
  platformProfit: {
    totalFeesCollected: number;
    contractProfits: Array<{ id: string; title: string; status: string; totalValue: number; platformFeePct: number; platformCut: number; otherParty: { name: string; email: string; role: string } }>;
    totalEscrowFees: number; totalReceiptFees: number;
  };
  paymentsGrouped: Array<{ type: string; status: string; qty: number; totalAmount: number; totalFees: number }>;
  ledgerGrouped: Array<{ type: string; reason: string; qty: number; totalEurCents: number }>;
  payments: Array<{ id: string; type: string; status: string; provider: string; amountEurCents: number; platformFee: number; createdAt: string; paidAt: string | null; refundedAt: string | null; description: string | null; contractId: string | null; contractTitle: string | null }>;
  contracts: Array<{ id: string; title: string; status: string; totalValue: number; platformFeePct: number; platformCut: number; otherParty: { name: string; email: string; role: string } }>;
  escrows: any[];
  receipts: any[];
  recurring: any[];
}

// ==================== HELPERS ====================

const EUR = (cents: number) => `\u20AC${(cents / 100).toFixed(2)}`;

const typeLabels: Record<string, string> = {
  ACTIVATION: "Ativacao", CONTRACT_FEE: "Taxa Contrato",
  SERVICE_PAYMENT: "Pag. Servico", REDEMPTION: "Resgate/Saque",
};

const auditStatusColors: Record<string, string> = {
  COMPLETED: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  FAILED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-primary/10 text-primary",
  PROCESSING: "bg-warning/10 text-warning",
  ACTIVE: "bg-success/10 text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
  DRAFT: "bg-muted text-muted-foreground",
};

const reasonLabels: Record<string, string> = {
  ACTIVATION_BONUS: "Bonus Ativacao", CONTRACT_FEE: "Taxa Contrato", SERVICE_PAYMENT: "Pag. Servico",
  PLATFORM_FEE: "Taxa Plataforma", REFERRAL_BONUS: "Bonus Indicacao",
  ADJUSTMENT: "Ajuste",
};

// ==================== MAIN PAGE ====================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function AdminPaymentsPage() {
  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <PageHeader
        title="Auditoria Financeira"
        description="Transacoes, pagamentos e auditoria por cliente"
      />

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="h-10">
            <TabsTrigger value="transactions" className="text-sm">Transacoes</TabsTrigger>
            <TabsTrigger value="audit" className="text-sm">Auditoria por Cliente</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="audit">
            <CustomerAuditTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

// ==================== TRANSACTIONS TAB ====================

function TransactionsTab() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const [paymentsRes, statsRes] = await Promise.all([
        apiFetch(`/api/admin/payments?${params}`),
        apiFetch("/api/admin/payments/stats"),
      ]);

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data.payments || []);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [typeFilter, statusFilter]);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ACTIVATION: "Ativacao",
      CONTRACT_FEE: "Taxa Contrato", SERVICE_PAYMENT: "Pagamento Servico", REDEMPTION: "Resgate",
    };
    return labels[type] || type;
  };

  const handleRefund = async (paymentId: string) => {
    const reason = prompt("Motivo do reembolso:");
    if (!reason) return;
    try {
      const response = await apiFetch(`/api/admin/payments/${paymentId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) fetchData();
      else { const data = await response.json(); toast({ title: "Erro", description: data.error || "Erro ao processar reembolso", variant: "destructive" }); }
    } catch { toast({ title: "Erro", description: "Erro ao processar reembolso", variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Hoje" value={formatCurrency(stats?.today || 0)} icon={<IconCreditCard className="h-5 w-5" />} loading={loading} />
        <StatsCard title="Este Mes" value={formatCurrency(stats?.thisMonth || 0)} icon={<IconTrendingUp className="h-5 w-5" />} loading={loading} />
        <StatsCard title="Reembolsos Pendentes" value={stats?.pendingRefunds || 0} icon={<IconAlertTriangle className="h-5 w-5" />} variant="warning" loading={loading} />
        <StatsCard title="Receita Total" value={formatCurrency(stats?.totalRevenue || 0)} icon={<IconCoin className="h-5 w-5" />} loading={loading} />
      </div>

      {/* Filters */}
      <BloomCard>
        <div className="p-5 sm:p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Input placeholder="Pesquisar por utilizador..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchData()} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="ACTIVATION">Ativacao</SelectItem>
                <SelectItem value="CONTRACT_FEE">Taxa Contrato</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="COMPLETED">Concluido</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="FAILED">Falhou</SelectItem>
                <SelectItem value="REFUNDED">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchData}>Filtrar</Button>
          </div>
        </div>
      </BloomCard>

      {/* Table */}
      <BloomCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium">ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Usuario</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Tipo</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Status</th>
                <th className="px-3 py-2 text-right text-xs font-medium">Valor</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Data</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (<td key={j} className="px-3 py-2"><Skeleton className="h-4 w-16" /></td>))}</tr>
                ))
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground text-sm">Nenhum pagamento encontrado</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs">{p.id.slice(0, 8)}...</td>
                    <td className="px-3 py-2">
                      <p className="text-sm font-medium">{p.userName}</p>
                      <p className="text-xs text-muted-foreground">{p.userEmail}</p>
                    </td>
                    <td className="px-3 py-2"><BloomBadge variant="outline" className="text-xs">{getTypeLabel(p.type)}</BloomBadge></td>
                    <td className="px-3 py-2">
                      <StatusBadge status={p.status === "COMPLETED" ? "completed" : p.status === "PENDING" ? "pending" : p.status === "FAILED" ? "failed" : p.status === "REFUNDED" ? "refunded" : "processing"} />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-sm">{formatCurrency(p.amountEurCents)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{format(new Date(p.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {p.stripePaymentIntentId && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(`https://dashboard.stripe.com/payments/${p.stripePaymentIntentId}`, "_blank")}>
                            <IconExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {p.status === "COMPLETED" && !p.refundedAt && (
                          <Button variant="ghost" size="sm" onClick={() => handleRefund(p.id)} className="text-destructive hover:text-destructive h-7 text-xs px-2">Reemb.</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </BloomCard>
    </div>
    );
  }

// ==================== CUSTOMER AUDIT TAB ====================

function CustomerAuditTab() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AuditData | null>(null);

  const search = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiFetch(`/api/admin/audit/customer?email=${encodeURIComponent(email.trim())}`);
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro"); }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input placeholder="Email do cliente..." value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} className="flex-1" />
            <Button onClick={search} disabled={loading}>
              {loading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconSearch className="h-4 w-4 mr-1" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2 text-sm text-destructive">
          <IconAlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AuditInfoCard icon={<IconUser className="h-4 w-4" />} label="Cliente" value={data.user.name} sub={`${data.user.email} | ${data.user.role}`} />
            <AuditInfoCard icon={<IconWallet className="h-4 w-4" />} label="Saldo Carteira" value={EUR(data.wallet.balanceEurCents)} />
            <AuditInfoCard icon={<IconArrowUp className="h-4 w-4 text-success" />} label="Total Depositos" value={EUR(data.summary.totalDeposits)} sub={`${data.summary.completedTransactions} tx aprovadas`} />
            <AuditInfoCard icon={<IconArrowDown className="h-4 w-4 text-destructive" />} label="Total Saques" value={EUR(data.summary.totalWithdrawals)} sub={`Reemb: ${EUR(data.summary.refundedAmount)}`} />
          </div>

          {/* Platform Profit */}
          <Card className="border-2 border-success/30 bg-success/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconEuro className="h-5 w-5 text-success" />
                  <span className="font-bold">Lucro da Plataforma com este cliente</span>
                </div>
                <span className="text-xl font-bold text-success">{EUR(data.platformProfit.totalFeesCollected)}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-white rounded-lg p-2.5">
                  <p className="text-muted-foreground">Taxas Cash-In (deposito)</p>
                  <p className="font-bold text-sm">{EUR(data.summary.depositFees)}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5">
                  <p className="text-muted-foreground">Taxas Cash-Out (saque)</p>
                  <p className="font-bold text-sm">{EUR(data.summary.withdrawalFees)}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5">
                  <p className="text-muted-foreground">Taxas Contrato</p>
                  <p className="font-bold text-sm">{EUR(data.summary.contractFeePlatform)}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5">
                  <p className="text-muted-foreground">Taxas Servico</p>
                  <p className="font-bold text-sm">{EUR(data.summary.servicePaymentFees)}</p>
                </div>
              </div>
              {(data.platformProfit.totalEscrowFees > 0 || data.platformProfit.totalReceiptFees > 0) && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Escrow: {EUR(data.platformProfit.totalEscrowFees)} | Recibos: {EUR(data.platformProfit.totalReceiptFees)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cross-Check */}
          <Card className={data.crossCheck.isConsistent ? "border-success/30" : "border-2 border-destructive/30"}>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <IconShield className="h-4 w-4" />
                Verificacao de Consistencia (Cruzamento)
                {data.crossCheck.isConsistent
                  ? <BloomBadge className="bg-success/10 text-success border-0 text-[10px]"><IconCheck className="h-3 w-3 mr-0.5" />OK</BloomBadge>
                  : <BloomBadge className="bg-destructive/10 text-destructive border-0 text-[10px]"><IconX className="h-3 w-3 mr-0.5" />Divergencia</BloomBadge>
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Entradas (depositos aprovados)</span><span className="font-medium text-success">+{EUR(data.crossCheck.totalIn)}</span></div>
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Gorjetas recebidas</span><span className="font-medium text-success">+{EUR(data.crossCheck.tipsReceived)}</span></div>
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Saidas (saques aprovados)</span><span className="font-medium text-destructive">-{EUR(data.crossCheck.totalOut)}</span></div>
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Gorjetas enviadas</span><span className="font-medium text-destructive">-{EUR(data.crossCheck.tipsSent)}</span></div>
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Taxas plataforma (total)</span><span className="font-medium text-destructive">-{EUR(data.crossCheck.totalFees)}</span></div>
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Reembolsos</span><span className="font-medium text-destructive">-{EUR(data.crossCheck.totalRefunded)}</span></div>
                <div className="flex justify-between py-1.5 font-bold text-base"><span>Saldo Esperado</span><span>{EUR(data.crossCheck.expectedBalance)}</span></div>
                <div className="flex justify-between py-1.5 font-bold text-base"><span>Saldo Real (carteira)</span><span>{EUR(data.crossCheck.actualBalance)}</span></div>
              </div>
              {!data.crossCheck.isConsistent && (
                <div className="mt-3 bg-destructive/10 rounded-lg p-3 text-sm text-destructive font-medium">
                  Diferenca: {EUR(Math.abs(data.crossCheck.difference))} ({data.crossCheck.difference > 0 ? "cliente sacou a mais" : "saldo nao contabilizado"})
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail Tabs */}
          <Tabs defaultValue="ctx">
            <TabsList className="h-9">
              <TabsTrigger value="ctx" className="text-xs">Transacoes ({data.payments.length})</TabsTrigger>
              <TabsTrigger value="grouped" className="text-xs">Agrupado</TabsTrigger>
              <TabsTrigger value="contracts" className="text-xs">Contratos ({data.contracts.length})</TabsTrigger>
              <TabsTrigger value="ledger" className="text-xs">Ledger</TabsTrigger>
              <TabsTrigger value="receipts" className="text-xs">Recibos ({data.receipts.length})</TabsTrigger>
            </TabsList>

            {/* Individual transactions */}
            <TabsContent value="ctx" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">Data</th>
                          <th className="px-2 py-2 text-left font-medium">Tipo</th>
                          <th className="px-2 py-2 text-left font-medium">Status</th>
                          <th className="px-2 py-2 text-right font-medium">Valor Bruto</th>
                          <th className="px-2 py-2 text-right font-medium">Taxa Plataforma</th>
                          <th className="px-2 py-2 text-right font-medium">Valor Liquido</th>
                          <th className="px-2 py-2 text-left font-medium">Descricao</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {data.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-muted/30">
                            <td className="px-2 py-1.5 whitespace-nowrap">{format(new Date(p.createdAt), "dd/MM/yy HH:mm", { locale: pt })}</td>
                            <td className="px-2 py-1.5">{typeLabels[p.type] || p.type}</td>
                            <td className="px-2 py-1.5"><BloomBadge className={`${auditStatusColors[p.status] || 'bg-muted'} border-0 text-[9px] px-1.5 py-0`}>{p.status}</BloomBadge></td>
                            <td className="px-2 py-1.5 text-right font-medium">{EUR(p.amountEurCents)}</td>
                            <td className="px-2 py-1.5 text-right text-warning font-medium">{p.platformFee > 0 ? EUR(p.platformFee) : '-'}</td>
                            <td className="px-2 py-1.5 text-right font-medium">{EUR(p.amountEurCents - (p.platformFee || 0))}</td>
                            <td className="px-2 py-1.5 truncate max-w-[120px]">{p.description || p.contractTitle || '-'}</td>
                          </tr>
                        ))}
                        {data.payments.length === 0 && <tr><td colSpan={7} className="px-2 py-6 text-center text-muted-foreground">Nenhuma transacao</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grouped */}
            <TabsContent value="grouped" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">Tipo</th>
                          <th className="px-2 py-2 text-left font-medium">Status</th>
                          <th className="px-2 py-2 text-right font-medium">Qtd</th>
                          <th className="px-2 py-2 text-right font-medium">Valor Total</th>
                          <th className="px-2 py-2 text-right font-medium">Taxas Cobradas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {data.paymentsGrouped.map((g, i) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-2 py-1.5 font-medium">{typeLabels[g.type] || g.type}</td>
                            <td className="px-2 py-1.5"><BloomBadge className={`${auditStatusColors[g.status] || 'bg-muted'} border-0 text-[9px] px-1.5 py-0`}>{g.status}</BloomBadge></td>
                            <td className="px-2 py-1.5 text-right">{g.qty}</td>
                            <td className="px-2 py-1.5 text-right font-medium">{EUR(g.totalAmount)}</td>
                            <td className="px-2 py-1.5 text-right text-warning font-bold">{g.totalFees > 0 ? EUR(g.totalFees) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contracts */}
            <TabsContent value="contracts" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">Contrato</th>
                          <th className="px-2 py-2 text-left font-medium">Status</th>
                          <th className="px-2 py-2 text-left font-medium">Outra Parte</th>
                          <th className="px-2 py-2 text-right font-medium">Valor Total</th>
                          <th className="px-2 py-2 text-right font-medium">% Plataforma</th>
                          <th className="px-2 py-2 text-right font-medium">Lucro Plataforma</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {data.contracts.map((c) => (
                          <tr key={c.id} className="hover:bg-muted/30">
                            <td className="px-2 py-1.5 font-medium truncate max-w-[120px]">{c.title || c.id.slice(0, 8)}</td>
                            <td className="px-2 py-1.5"><BloomBadge className={`${auditStatusColors[c.status] || 'bg-muted'} border-0 text-[9px] px-1.5 py-0`}>{c.status}</BloomBadge></td>
                            <td className="px-2 py-1.5">{c.otherParty.name} <span className="text-muted-foreground">({c.otherParty.role})</span></td>
                            <td className="px-2 py-1.5 text-right font-medium">{EUR(c.totalValue)}</td>
                            <td className="px-2 py-1.5 text-right">{c.platformFeePct}%</td>
                            <td className="px-2 py-1.5 text-right font-bold text-success">{EUR(c.platformCut)}</td>
                          </tr>
                        ))}
                        {data.contracts.length === 0 && <tr><td colSpan={6} className="px-2 py-6 text-center text-muted-foreground">Nenhum contrato</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ledger */}
            <TabsContent value="ledger" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">Tipo</th>
                          <th className="px-2 py-2 text-left font-medium">Razao</th>
                          <th className="px-2 py-2 text-right font-medium">Qtd</th>
                          <th className="px-2 py-2 text-right font-medium">EUR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {data.ledgerGrouped.map((l, i) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-2 py-1.5">
                              <BloomBadge className={`${l.type === 'CREDIT' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'} border-0 text-[9px] px-1.5 py-0`}>
                                {l.type === 'CREDIT' ? 'ENTRADA' : 'SAIDA'}
                              </BloomBadge>
                            </td>
                            <td className="px-2 py-1.5">{reasonLabels[l.reason] || l.reason}</td>
                            <td className="px-2 py-1.5 text-right">{l.qty}</td>
                            <td className="px-2 py-1.5 text-right">{EUR(l.totalEurCents)}</td>
                          </tr>
                        ))}
                        {data.ledgerGrouped.length === 0 && <tr><td colSpan={4} className="px-2 py-6 text-center text-muted-foreground">Nenhum movimento</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Receipts */}
            <TabsContent value="receipts" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">Numero</th>
                          <th className="px-2 py-2 text-left font-medium">Periodo</th>
                          <th className="px-2 py-2 text-right font-medium">Horas</th>
                          <th className="px-2 py-2 text-right font-medium">Total</th>
                          <th className="px-2 py-2 text-right font-medium">Taxa Plataforma</th>
                          <th className="px-2 py-2 text-right font-medium">Cuidador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {(data.receipts as any[]).map((r: any) => (
                          <tr key={r.id} className="hover:bg-muted/30">
                            <td className="px-2 py-1.5 font-mono">{r.receiptNumber}</td>
                            <td className="px-2 py-1.5">{format(new Date(r.periodStart), "dd/MM/yy", { locale: pt })} - {format(new Date(r.periodEnd), "dd/MM/yy", { locale: pt })}</td>
                            <td className="px-2 py-1.5 text-right">{r.hoursWorked}h</td>
                            <td className="px-2 py-1.5 text-right font-medium">{EUR(r.totalAmountCents)}</td>
                            <td className="px-2 py-1.5 text-right text-warning font-medium">{EUR(r.platformFeeCents)}</td>
                            <td className="px-2 py-1.5 text-right">{EUR(r.caregiverAmountCents)}</td>
                          </tr>
                        ))}
                        {data.receipts.length === 0 && <tr><td colSpan={6} className="px-2 py-6 text-center text-muted-foreground">Nenhum recibo</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bottom stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AuditInfoCard label="Gorjetas Enviadas" value={EUR(data.tipsSent.total)} sub={`${data.tipsSent.qty} gorjetas`} />
            <AuditInfoCard label="Gorjetas Recebidas" value={EUR(data.tipsReceived.total)} sub={`${data.tipsReceived.qty} gorjetas`} />
            <AuditInfoCard label="Pendente" value={EUR(data.summary.pendingAmount)} sub="Aguardando aprovacao" />
            <AuditInfoCard label="Falhou" value={EUR(data.summary.failedAmount)} sub="Transacoes com erro" />
          </div>
        </>
      )}
    </div>
  );
}

function AuditInfoCard({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          {icon}
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
        <p className="text-sm font-bold">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
