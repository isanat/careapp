"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconSearch,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconArrowUp,
  IconArrowDown,
  IconUser,
  IconWallet,
  IconContract,
  IconEuro,
  IconShield,
} from "@/components/icons";
import { apiFetch } from "@/lib/api-client";

interface AuditData {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    phone: string | null;
    nif: string | null;
    createdAt: string;
  };
  wallet: { balanceTokens: number; balanceEurCents: number };
  summary: {
    totalDeposits: number;
    depositFees: number;
    depositTokens: number;
    totalWithdrawals: number;
    withdrawalFees: number;
    totalContractFees: number;
    contractFeePlatform: number;
    totalServicePayments: number;
    servicePaymentFees: number;
    totalPlatformFees: number;
    pendingAmount: number;
    failedAmount: number;
    refundedAmount: number;
    totalTransactions: number;
    completedTransactions: number;
  };
  tipsSent: { total: number; qty: number };
  tipsReceived: { total: number; qty: number };
  crossCheck: {
    totalIn: number;
    totalOut: number;
    totalFees: number;
    totalRefunded: number;
    tipsSent: number;
    tipsReceived: number;
    expectedBalance: number;
    actualBalance: number;
    difference: number;
    isConsistent: boolean;
  };
  platformProfit: {
    totalFeesCollected: number;
    contractProfits: Array<{
      id: string;
      title: string;
      status: string;
      totalValue: number;
      platformFeePct: number;
      platformCut: number;
      otherParty: { name: string; email: string; role: string };
    }>;
    totalEscrowFees: number;
    totalReceiptFees: number;
  };
  paymentsGrouped: Array<{
    type: string;
    status: string;
    qty: number;
    totalAmount: number;
    totalFees: number;
    totalTokens: number;
  }>;
  ledgerGrouped: Array<{
    type: string;
    reason: string;
    qty: number;
    totalTokens: number;
    totalEurCents: number;
  }>;
  payments: Array<{
    id: string;
    type: string;
    status: string;
    provider: string;
    amountEurCents: number;
    tokensAmount: number;
    platformFee: number;
    createdAt: string;
    paidAt: string | null;
    refundedAt: string | null;
    description: string | null;
    contractId: string | null;
    contractTitle: string | null;
  }>;
  contracts: Array<{
    id: string;
    title: string;
    status: string;
    totalValue: number;
    platformFeePct: number;
    platformCut: number;
    otherParty: { name: string; email: string; role: string };
  }>;
  escrows: any[];
  receipts: any[];
  recurring: any[];
}

const EUR = (cents: number) => `\u20AC${(cents / 100).toFixed(2)}`;

const typeLabels: Record<string, string> = {
  ACTIVATION: "Ativacao",
  TOKEN_PURCHASE: "Compra Tokens",
  CONTRACT_FEE: "Taxa Contrato",
  SERVICE_PAYMENT: "Pag. Servico",
  REDEMPTION: "Resgate/Saque",
};

const statusColors: Record<string, string> = {
  COMPLETED: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  FAILED: "bg-error/10 text-error",
  REFUNDED: "bg-secondary/10 text-secondary",
  PROCESSING: "bg-primary/10 text-primary",
  ACTIVE: "bg-success/10 text-success",
  CANCELLED: "bg-error/10 text-error",
  DRAFT: "bg-muted text-muted-foreground",
};

const reasonLabels: Record<string, string> = {
  ACTIVATION_BONUS: "Bonus Ativacao",
  CONTRACT_FEE: "Taxa Contrato",
  SERVICE_PAYMENT: "Pag. Servico",
  TIP_RECEIVED: "Gorjeta Recebida",
  TIP_SENT: "Gorjeta Enviada",
  TOKEN_PURCHASE: "Compra Tokens",
  TOKEN_REDEMPTION: "Resgate Tokens",
  PLATFORM_FEE: "Taxa Plataforma",
  REFERRAL_BONUS: "Bonus Indicacao",
  ADJUSTMENT: "Ajuste",
};

export default function AuditPage() {
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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro");
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Auditoria por Cliente"
        description="Historico financeiro completo - depositos, saques, taxas, lucro da plataforma"
      />

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Email do cliente..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              className="flex-1"
            />
            <Button onClick={search} disabled={loading}>
              {loading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconSearch className="h-4 w-4 mr-1" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-error/5 border border-error/20 rounded-lg p-3 flex items-center gap-2 text-sm text-error">
          <IconAlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {data && (
        <>
          {/* Customer Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <InfoCard icon={<IconUser className="h-4 w-4" />} label="Cliente" value={data.user.name} sub={`${data.user.email} | ${data.user.role}`} />
            <InfoCard icon={<IconWallet className="h-4 w-4" />} label="Saldo Carteira" value={EUR(data.wallet.balanceEurCents)} sub={`${data.wallet.balanceTokens.toLocaleString()} tokens`} />
            <InfoCard icon={<IconArrowUp className="h-4 w-4 text-success" />} label="Total Depositos" value={EUR(data.summary.totalDeposits)} sub={`${data.summary.completedTransactions} tx aprovadas`} />
            <InfoCard icon={<IconArrowDown className="h-4 w-4 text-error" />} label="Total Saques" value={EUR(data.summary.totalWithdrawals)} sub={`Reemb: ${EUR(data.summary.refundedAmount)}`} />
          </div>

          {/* Platform Profit - HIGHLIGHTED */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconEuro className="h-5 w-5 text-primary" />
                  <span className="font-bold text-base">Lucro da Plataforma com este cliente</span>
                </div>
                <span className="text-xl font-bold text-primary">{EUR(data.platformProfit.totalFeesCollected)}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-white dark:bg-surface rounded-lg p-2">
                  <p className="text-muted-foreground">Taxas Deposito</p>
                  <p className="font-bold">{EUR(data.summary.depositFees)}</p>
                </div>
                <div className="bg-white dark:bg-surface rounded-lg p-2">
                  <p className="text-muted-foreground">Taxas Saque</p>
                  <p className="font-bold">{EUR(data.summary.withdrawalFees)}</p>
                </div>
                <div className="bg-white dark:bg-surface rounded-lg p-2">
                  <p className="text-muted-foreground">Taxas Contrato</p>
                  <p className="font-bold">{EUR(data.summary.contractFeePlatform)}</p>
                </div>
                <div className="bg-white dark:bg-surface rounded-lg p-2">
                  <p className="text-muted-foreground">Taxas Servico</p>
                  <p className="font-bold">{EUR(data.summary.servicePaymentFees)}</p>
                </div>
              </div>
              {data.platformProfit.totalEscrowFees > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Escrow fees: {EUR(data.platformProfit.totalEscrowFees)} | Receipt fees: {EUR(data.platformProfit.totalReceiptFees)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cross-Check */}
          <Card className={data.crossCheck.isConsistent ? "border-success/30" : "border-error/30 border-2"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <IconShield className="h-4 w-4" />
                Verificacao de Consistencia
                {data.crossCheck.isConsistent
                  ? <Badge className="bg-success/10 text-success border-0 text-[10px]"><IconCheck className="h-3 w-3 mr-0.5" />Consistente</Badge>
                  : <Badge className="bg-error/10 text-error border-0 text-[10px]"><IconX className="h-3 w-3 mr-0.5" />Divergencia</Badge>
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Entradas (depositos)</span>
                  <span className="font-medium text-success">+{EUR(data.crossCheck.totalIn)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Gorjetas recebidas</span>
                  <span className="font-medium text-success">+{EUR(data.crossCheck.tipsReceived)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Saidas (saques)</span>
                  <span className="font-medium text-error">-{EUR(data.crossCheck.totalOut)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Gorjetas enviadas</span>
                  <span className="font-medium text-error">-{EUR(data.crossCheck.tipsSent)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Taxas plataforma</span>
                  <span className="font-medium text-error">-{EUR(data.crossCheck.totalFees)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Reembolsos</span>
                  <span className="font-medium text-error">-{EUR(data.crossCheck.totalRefunded)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold">
                  <span>Saldo esperado</span>
                  <span>{EUR(data.crossCheck.expectedBalance)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold">
                  <span>Saldo real (carteira)</span>
                  <span>{EUR(data.crossCheck.actualBalance)}</span>
                </div>
              </div>
              {!data.crossCheck.isConsistent && (
                <div className="mt-2 bg-error/5 rounded-lg p-2 text-xs text-error font-medium">
                  Diferenca: {EUR(Math.abs(data.crossCheck.difference))} - pode indicar transacoes nao contabilizadas, splits ou ajustes manuais.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs: Transacoes, Contratos, Ledger, Recibos */}
          <Tabs defaultValue="transactions">
            <TabsList className="grid grid-cols-5 h-9">
              <TabsTrigger value="transactions" className="text-xs">Transacoes ({data.payments.length})</TabsTrigger>
              <TabsTrigger value="grouped" className="text-xs">Agrupado</TabsTrigger>
              <TabsTrigger value="contracts" className="text-xs">Contratos ({data.contracts.length})</TabsTrigger>
              <TabsTrigger value="ledger" className="text-xs">Ledger</TabsTrigger>
              <TabsTrigger value="receipts" className="text-xs">Recibos ({data.receipts.length})</TabsTrigger>
            </TabsList>

            {/* Individual Transactions */}
            <TabsContent value="transactions" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">Data</th>
                          <th className="px-2 py-2 text-left font-medium">Tipo</th>
                          <th className="px-2 py-2 text-left font-medium">Status</th>
                          <th className="px-2 py-2 text-right font-medium">Valor</th>
                          <th className="px-2 py-2 text-right font-medium">Taxa</th>
                          <th className="px-2 py-2 text-right font-medium">Tokens</th>
                          <th className="px-2 py-2 text-left font-medium">Descricao</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {data.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-muted/30">
                            <td className="px-2 py-1.5 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString('pt-PT')}</td>
                            <td className="px-2 py-1.5">{typeLabels[p.type] || p.type}</td>
                            <td className="px-2 py-1.5">
                              <Badge className={`${statusColors[p.status] || 'bg-muted'} border-0 text-[9px] px-1.5 py-0`}>{p.status}</Badge>
                            </td>
                            <td className="px-2 py-1.5 text-right font-medium">{EUR(p.amountEurCents)}</td>
                            <td className="px-2 py-1.5 text-right text-muted-foreground">{p.platformFee > 0 ? EUR(p.platformFee) : '-'}</td>
                            <td className="px-2 py-1.5 text-right">{p.tokensAmount || '-'}</td>
                            <td className="px-2 py-1.5 truncate max-w-[150px]">{p.description || p.contractTitle || '-'}</td>
                          </tr>
                        ))}
                        {data.payments.length === 0 && (
                          <tr><td colSpan={7} className="px-2 py-6 text-center text-muted-foreground">Nenhuma transacao</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grouped by type+status */}
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
                          <th className="px-2 py-2 text-right font-medium">Taxas Total</th>
                          <th className="px-2 py-2 text-right font-medium">Tokens Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {data.paymentsGrouped.map((g, i) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-2 py-1.5 font-medium">{typeLabels[g.type] || g.type}</td>
                            <td className="px-2 py-1.5">
                              <Badge className={`${statusColors[g.status] || 'bg-muted'} border-0 text-[9px] px-1.5 py-0`}>{g.status}</Badge>
                            </td>
                            <td className="px-2 py-1.5 text-right">{g.qty}</td>
                            <td className="px-2 py-1.5 text-right font-medium">{EUR(g.totalAmount)}</td>
                            <td className="px-2 py-1.5 text-right text-primary font-medium">{g.totalFees > 0 ? EUR(g.totalFees) : '-'}</td>
                            <td className="px-2 py-1.5 text-right">{g.totalTokens || '-'}</td>
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
                            <td className="px-2 py-1.5 font-medium truncate max-w-[150px]">{c.title || c.id.slice(0, 8)}</td>
                            <td className="px-2 py-1.5">
                              <Badge className={`${statusColors[c.status] || 'bg-muted'} border-0 text-[9px] px-1.5 py-0`}>{c.status}</Badge>
                            </td>
                            <td className="px-2 py-1.5">
                              <span>{c.otherParty.name}</span>
                              <span className="text-muted-foreground ml-1">({c.otherParty.role})</span>
                            </td>
                            <td className="px-2 py-1.5 text-right font-medium">{EUR(c.totalValue)}</td>
                            <td className="px-2 py-1.5 text-right">{c.platformFeePct}%</td>
                            <td className="px-2 py-1.5 text-right font-bold text-primary">{EUR(c.platformCut)}</td>
                          </tr>
                        ))}
                        {data.contracts.length === 0 && (
                          <tr><td colSpan={6} className="px-2 py-6 text-center text-muted-foreground">Nenhum contrato</td></tr>
                        )}
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
                          <th className="px-2 py-2 text-right font-medium">Tokens</th>
                          <th className="px-2 py-2 text-right font-medium">EUR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {data.ledgerGrouped.map((l, i) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-2 py-1.5">
                              <Badge className={`${l.type === 'CREDIT' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'} border-0 text-[9px] px-1.5 py-0`}>
                                {l.type}
                              </Badge>
                            </td>
                            <td className="px-2 py-1.5">{reasonLabels[l.reason] || l.reason}</td>
                            <td className="px-2 py-1.5 text-right">{l.qty}</td>
                            <td className="px-2 py-1.5 text-right font-medium">{l.totalTokens?.toLocaleString()}</td>
                            <td className="px-2 py-1.5 text-right">{EUR(l.totalEurCents)}</td>
                          </tr>
                        ))}
                        {data.ledgerGrouped.length === 0 && (
                          <tr><td colSpan={5} className="px-2 py-6 text-center text-muted-foreground">Nenhum movimento</td></tr>
                        )}
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
                          <th className="px-2 py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {(data.receipts as any[]).map((r: any) => (
                          <tr key={r.id} className="hover:bg-muted/30">
                            <td className="px-2 py-1.5 font-mono">{r.receiptNumber}</td>
                            <td className="px-2 py-1.5">{new Date(r.periodStart).toLocaleDateString('pt-PT')} - {new Date(r.periodEnd).toLocaleDateString('pt-PT')}</td>
                            <td className="px-2 py-1.5 text-right">{r.hoursWorked}h</td>
                            <td className="px-2 py-1.5 text-right font-medium">{EUR(r.totalAmountCents)}</td>
                            <td className="px-2 py-1.5 text-right text-primary font-medium">{EUR(r.platformFeeCents)}</td>
                            <td className="px-2 py-1.5 text-right">{EUR(r.caregiverAmountCents)}</td>
                            <td className="px-2 py-1.5">{r.status}</td>
                          </tr>
                        ))}
                        {data.receipts.length === 0 && (
                          <tr><td colSpan={7} className="px-2 py-6 text-center text-muted-foreground">Nenhum recibo</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Gorjetas + Pendentes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <InfoCard label="Gorjetas Enviadas" value={EUR(data.tipsSent.total)} sub={`${data.tipsSent.qty} gorjetas`} />
            <InfoCard label="Gorjetas Recebidas" value={EUR(data.tipsReceived.total)} sub={`${data.tipsReceived.qty} gorjetas`} />
            <InfoCard label="Pendente" value={EUR(data.summary.pendingAmount)} sub="Aguardando" />
            <InfoCard label="Falhou" value={EUR(data.summary.failedAmount)} sub="Transacoes falhadas" />
          </div>
        </>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: string | number; sub?: string }) {
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
