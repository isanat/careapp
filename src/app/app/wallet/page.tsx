"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/layout/app-shell";
import {
  IconWallet,
  IconArrowUp,
  IconArrowDown,
  IconEuro,
  IconLoader2,
  IconAlert,
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

interface Wallet {
  id: string;
  balanceEurCents: number;
}

interface Transaction {
  id: string;
  type: string;
  reason: string;
  eurCents: number;
  description: string;
  date: string;
}

export default function WalletPage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseAmount, setPurchaseAmount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") fetchWallet();
  }, [status]);

  const fetchWallet = async () => {
    try {
      const response = await apiFetch('/api/user/wallet');
      if (response.ok) {
        const data = await response.json();
        setWallet(data.wallet);
        setTransactions(data.transactions || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!session?.user?.id) return;
    setIsProcessing(true);
    setError("");
    try {
      const response = await apiFetch("/api/payments/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, amount: purchaseAmount * 100 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 animate-pulse">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!wallet) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <IconWallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">Carteira nao encontrada</h3>
          <p className="text-sm text-muted-foreground mb-4">Active a sua conta para comecar</p>
          <Button asChild className="rounded-xl">
            <Link href="/auth/payment">Ativar conta</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const balanceEur = (wallet.balanceEurCents / 100).toFixed(2);
  const isFamily = session?.user?.role === "FAMILY";

  return (
    <AppShell>
      <div className="space-y-3">
        {error && (
          <div className="px-3 py-2 bg-error/5 border border-error/20 text-error rounded-lg text-xs flex items-center gap-2">
            <IconAlert className="h-3.5 w-3.5 shrink-0" />{error}
          </div>
        )}

        {/* Balance - compact inline */}
        <div className={`rounded-xl px-4 py-3 text-white flex items-center justify-between ${isFamily ? 'gradient-primary' : 'gradient-secondary'}`}>
          <div>
            <p className="text-xs opacity-80">{t.wallet.balance}</p>
            <p className="text-xl font-bold">{"\u20AC"}{balanceEur}</p>
          </div>
          <Button
            size="sm"
            onClick={handlePurchase}
            disabled={isProcessing}
            className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 px-3"
          >
            {isProcessing ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" /> : <IconEuro className="h-3.5 w-3.5 mr-1" />}
            {t.wallet.addFunds || "Adicionar"}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history">
          <TabsList className="w-full grid grid-cols-2 h-8 rounded-lg bg-muted p-0.5">
            <TabsTrigger value="history" className="rounded-md text-xs data-[state=active]:shadow-sm">Historico</TabsTrigger>
            <TabsTrigger value="add" className="rounded-md text-xs data-[state=active]:shadow-sm">Adicionar</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-3 space-y-1">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border/30">
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                      tx.type === "CREDIT" ? "bg-success/10" : "bg-error/10"
                    }`}>
                      {tx.type === "CREDIT"
                        ? <IconArrowUp className="h-3.5 w-3.5 text-success" />
                        : <IconArrowDown className="h-3.5 w-3.5 text-error" />
                      }
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate max-w-[160px]">{tx.description || tx.reason}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${
                    tx.type === "CREDIT" ? "text-success" : "text-error"
                  }`}>
                    {tx.type === "CREDIT" ? "+" : "-"}{"\u20AC"}{(tx.eurCents / 100).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-surface rounded-xl border border-border/30">
                <IconWallet className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t.wallet.noTransactions}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-3 space-y-3">
            <div className="bg-surface rounded-xl p-3 border border-border/30 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-muted-foreground">{"\u20AC"}</span>
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                  className="h-9 text-base font-semibold"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 100, 200].map((amount) => (
                  <Button
                    key={amount}
                    variant={purchaseAmount === amount ? "default" : "outline"}
                    onClick={() => setPurchaseAmount(amount)}
                    size="sm"
                    className="font-semibold"
                  >
                    {"\u20AC"}{amount}
                  </Button>
                ))}
              </div>

              <Button
                className="w-full h-10 font-semibold"
                onClick={handlePurchase}
                disabled={isProcessing}
              >
                {isProcessing
                  ? <IconLoader2 className="h-4 w-4 animate-spin" />
                  : `Pagar ${"\u20AC"}${purchaseAmount}`
                }
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">Processado de forma segura</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className}`} />;
}
