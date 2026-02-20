"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/common/page-header";
import { StatsCard } from "@/components/admin/common/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconCoin,
  IconRefresh,
  IconAdjustments,
  IconTrendingUp,
  IconUsers,
  IconWallet,
  IconAlertTriangle,
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface TokenStats {
  totalMinted: number;
  totalBurned: number;
  inCirculation: number;
  reserveEurCents: number;
  currentPriceCents: number;
  holdersCount: number;
  coverage: number;
}

interface TokenTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  reason: string;
  amountTokens: number;
  amountEurCents: number;
  description: string | null;
  createdAt: string;
  txHash: string | null;
}

export default function AdminTokensPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    userId: "",
    type: "CREDIT",
    amount: "",
    reason: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, txRes] = await Promise.all([
        fetch("/api/admin/tokens/stats"),
        fetch("/api/admin/tokens/transactions"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching token data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const handleAdjustment = async () => {
    if (!adjustForm.userId || !adjustForm.amount || !adjustForm.reason) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/tokens/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adjustForm.userId,
          type: adjustForm.type,
          amount: parseInt(adjustForm.amount),
          reason: adjustForm.reason,
        }),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Ajuste realizado" });
        setAdjustDialogOpen(false);
        fetchData();
      } else {
        const data = await response.json();
        toast({
          title: "Erro",
          description: data.error || "Falha ao processar",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar ajuste",
        variant: "destructive",
      });
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      ACTIVATION_BONUS: "Bônus Ativação",
      CONTRACT_FEE: "Taxa Contrato",
      SERVICE_PAYMENT: "Pagamento Serviço",
      TIP_RECEIVED: "Gorjeta Recebida",
      TIP_SENT: "Gorjeta Enviada",
      TOKEN_PURCHASE: "Compra Tokens",
      TOKEN_REDEMPTION: "Resgate Tokens",
      PLATFORM_FEE: "Taxa Plataforma",
      REFERRAL_BONUS: "Bônus Indicação",
      ADJUSTMENT: "Ajuste Manual",
    };
    return labels[reason] || reason;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tokens"
        description="Gestão de tokens e economia da plataforma"
        actions={
          <div className="flex gap-2">
            <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <IconAdjustments className="h-4 w-4 mr-2" />
                  Ajuste Manual
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajuste Manual de Tokens</DialogTitle>
                  <DialogDescription>
                    Adicione ou remova tokens de uma carteira
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ID do Usuário</label>
                    <Input
                      placeholder="clx1234..."
                      value={adjustForm.userId}
                      onChange={(e) =>
                        setAdjustForm({ ...adjustForm, userId: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select
                      value={adjustForm.type}
                      onValueChange={(v) => setAdjustForm({ ...adjustForm, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CREDIT">Crédito</SelectItem>
                        <SelectItem value="DEBIT">Débito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantidade (SENT)</label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={adjustForm.amount}
                      onChange={(e) =>
                        setAdjustForm({ ...adjustForm, amount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Motivo *</label>
                    <Input
                      placeholder="Motivo do ajuste"
                      value={adjustForm.reason}
                      onChange={(e) =>
                        setAdjustForm({ ...adjustForm, reason: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAdjustment}>Confirmar Ajuste</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={fetchData}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* Token Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tokens em Circulação"
          value={stats?.inCirculation?.toLocaleString() || 0}
          description="SENT"
          icon={<IconCoin className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Reserva EUR"
          value={formatCurrency(stats?.reserveEurCents || 0)}
          icon={<IconWallet className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Preço do Token"
          value={formatCurrency(stats?.currentPriceCents || 1)}
          description="1 SENT"
          icon={<IconTrendingUp className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Holders"
          value={stats?.holdersCount || 0}
          description="Carteiras ativas"
          icon={<IconUsers className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      {/* Coverage Alert */}
      {stats && stats.coverage < 100 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardContent className="flex items-center gap-4 p-4">
            <IconAlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-700">Cobertura Insuficiente</p>
              <p className="text-sm text-amber-600">
                A reserva cobre apenas {stats.coverage.toFixed(1)}% dos tokens em circulação.
                O ideal é 100%.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estatísticas de Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Minted</span>
              <span className="font-medium">
                {stats?.totalMinted?.toLocaleString() || 0} SENT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Queimado</span>
              <span className="font-medium">
                {stats?.totalBurned?.toLocaleString() || 0} SENT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cobertura</span>
              <Badge className={stats?.coverage === 100 ? "bg-green-500" : "bg-amber-500"}>
                {stats?.coverage?.toFixed(1) || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Economia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Preço:</strong> 1 SENT = €0.01 (fixo)
            </p>
            <p>
              <strong>Taxa de Ativação:</strong> €35 → 3.500 SENT
            </p>
            <p>
              <strong>Taxa de Contrato:</strong> €5 por parte
            </p>
            <p>
              <strong>Taxa da Plataforma:</strong> 15% sobre contratos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Transações</CardTitle>
          <CardDescription>Últimas movimentações de tokens</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Usuário</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Razão</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Tokens</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">EUR</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 20).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString("pt-PT")}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{tx.userName}</p>
                          <p className="text-xs text-slate-500">{tx.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={tx.type === "CREDIT" ? "default" : "secondary"}>
                          {tx.type === "CREDIT" ? "Crédito" : "Débito"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getReasonLabel(tx.reason)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        tx.type === "CREDIT" ? "text-green-600" : "text-red-600"
                      }`}>
                        {tx.type === "CREDIT" ? "+" : "-"}
                        {tx.amountTokens.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">
                        {formatCurrency(tx.amountEurCents)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
