"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import {
  BloomCard,
  BloomStatBlock,
  BloomSectionHeader,
  BloomBadge,
} from "@/components/bloom-custom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { tokens, cn } from "@/lib/design-tokens";
import {
  IconWallet,
  IconEuro,
  IconTrendingUp,
  IconClock,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

interface WalletBalance {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  lastWithdrawal?: { amount: number; date: string; status: string };
}

interface Transaction {
  id: string;
  type: "earning" | "withdrawal" | "fee";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [walletData, setWalletData] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchWalletData();
  }, [status]);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const statsRes = await apiFetch("/api/user/stats");
      if (!statsRes.ok) throw new Error("Failed to fetch wallet data");
      const statsData = await statsRes.json();
      setWalletData({
        availableBalance: statsData.availableBalance || 0,
        pendingBalance: statsData.pendingBalance || 0,
        totalEarnings: statsData.totalEarnings || 0,
        lastWithdrawal: statsData.lastWithdrawal,
      });

      const paymentsRes = await apiFetch("/api/payments/recurring");
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        const txns = paymentsData.payments?.map((p: any) => ({
          id: p.id,
          type: p.type || "earning",
          amount: p.amount,
          description: p.description || `Payment from contract`,
          date: p.createdAt || new Date().toISOString(),
          status: p.status || "completed",
        })) || [];
        setTransactions(txns.slice(0, 10));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    try {
      console.log("Withdrawal requested:", withdrawAmount);
      setShowWithdrawModal(false);
      setWithdrawAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    }
  };

  if (isLoading) {
    return (
      <div className={cn(tokens.layout.sectionSpacing, tokens.layout.maxWidth)}>
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(tokens.layout.sectionSpacing, tokens.layout.maxWidth, tokens.spacing.paddingX.responsive)}>
      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-2">
          <IconWallet className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-display font-black uppercase">Carteira</h1>
        </div>
        <p className="text-base text-muted-foreground font-medium">
          Gerencie seu saldo e histórico de transações
        </p>
      </div>

      {walletData && (
        <div className="mb-8">
          <BloomCard topBar topBarColor="bg-primary">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                    Saldo Disponível
                  </p>
                  <p className="text-4xl font-display font-black text-primary">
                    €{walletData.availableBalance.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                    Saldo Pendente
                  </p>
                  <p className="text-4xl font-display font-black text-warning">
                    €{walletData.pendingBalance.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <IconArrowLeft className="h-4 w-4 mr-2" />
                      Sacar Fundos
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sacar Fundos da Carteira</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleWithdraw} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Valor</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={walletData.availableBalance}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Máximo: €{walletData.availableBalance.toFixed(2)}
                        </p>
                      </div>
                      <Button type="submit" className="w-full">
                        Solicitar Saque
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" className="flex-1">
                  <IconTrendingUp className="h-4 w-4 mr-2" />
                  Ver Analytics
                </Button>
              </div>
            </div>
          </BloomCard>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <BloomStatBlock
          icon={<IconEuro className="h-6 w-6" />}
          label="Ganhos Totais"
          value={`€${walletData?.totalEarnings.toFixed(2) || "0.00"}`}
        />
        <BloomStatBlock
          icon={<IconClock className="h-6 w-6" />}
          label="Saldo Pendente"
          value={`€${walletData?.pendingBalance.toFixed(2) || "0.00"}`}
        />
        <BloomStatBlock
          icon={<IconCheck className="h-6 w-6" />}
          label="Último Saque"
          value={
            walletData?.lastWithdrawal
              ? `€${walletData.lastWithdrawal.amount.toFixed(2)}`
              : "—"
          }
        />
      </div>

      <BloomSectionHeader title="Histórico de Transações" />
      {transactions.length > 0 ? (
        <BloomCard>
          <div className="space-y-0 divide-y divide-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {tx.type === "earning" && (
                      <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                        <IconArrowRight className="h-5 w-5 text-success" />
                      </div>
                    )}
                    {tx.type === "withdrawal" && (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconArrowLeft className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("pt-PT", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={cn("font-semibold", tx.type === "earning" ? "text-success" : "text-primary")}>
                      {tx.type === "earning" ? "+" : "−"}€{tx.amount.toFixed(2)}
                    </p>
                    <BloomBadge
                      variant={
                        tx.status === "completed"
                          ? "success"
                          : tx.status === "pending"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {tx.status === "completed" ? "Concluído" : tx.status === "pending" ? "Pendente" : "Falhou"}
                    </BloomBadge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BloomCard>
      ) : (
        <BloomCard>
          <div className="text-center py-12">
            <IconWallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma transação ainda</p>
          </div>
        </BloomCard>
      )}
    </div>
  );
}
