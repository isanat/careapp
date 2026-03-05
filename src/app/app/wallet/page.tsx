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
      <div className="space-y-5">
        {/* Header */}
        <h1 className="text-2xl font-bold">{t.wallet.title}</h1>

        {error && (
          <div className="p-3 bg-error/5 border border-error/20 text-error rounded-xl text-sm flex items-center gap-2">
            <IconAlert className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* Balance Card */}
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-soft-md ${isFamily ? 'gradient-primary' : 'gradient-violet'}`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">{t.wallet.balance}</p>
                <p className="text-4xl font-bold mt-1">{"\u20AC"}{balanceEur}</p>
              </div>
              <Button
                size="sm"
                onClick={handlePurchase}
                disabled={isProcessing}
                className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl h-10 px-4"
              >
                {isProcessing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconEuro className="h-4 w-4 mr-1.5" />}
                {t.wallet.addFunds || "Adicionar"}
              </Button>
            </div>
          </div>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 h-32 w-32 rounded-full bg-white/5" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history">
          <TabsList className="w-full grid grid-cols-2 h-10 rounded-xl bg-muted p-1">
            <TabsTrigger value="history" className="rounded-lg text-sm data-[state=active]:shadow-sm">
              Historico
            </TabsTrigger>
            <TabsTrigger value="add" className="rounded-lg text-sm data-[state=active]:shadow-sm">
              Adicionar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4 space-y-2">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-surface rounded-xl shadow-card border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      tx.type === "CREDIT" ? "bg-success/10" : "bg-error/10"
                    }`}>
                      {tx.type === "CREDIT"
                        ? <IconArrowUp className="h-4 w-4 text-success" />
                        : <IconArrowDown className="h-4 w-4 text-error" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[180px]">{tx.description || tx.reason}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tx.type === "CREDIT" ? "text-success" : "text-error"
                  }`}>
                    {tx.type === "CREDIT" ? "+" : "-"}{"\u20AC"}{(tx.eurCents / 100).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-surface rounded-2xl shadow-card border border-border/50">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <IconWallet className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t.wallet.noTransactions}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-4 space-y-4">
            <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Valor a adicionar</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-muted-foreground">{"\u20AC"}</span>
                  <Input
                    type="number"
                    min={10}
                    max={1000}
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                    className="h-12 text-lg font-semibold rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 200].map((amount) => (
                  <Button
                    key={amount}
                    variant={purchaseAmount === amount ? "default" : "outline"}
                    onClick={() => setPurchaseAmount(amount)}
                    className="h-10 rounded-xl font-semibold"
                  >
                    {"\u20AC"}{amount}
                  </Button>
                ))}
              </div>

              <Button
                className="w-full h-12 rounded-xl text-base font-semibold"
                onClick={handlePurchase}
                disabled={isProcessing}
              >
                {isProcessing
                  ? <IconLoader2 className="h-5 w-5 animate-spin" />
                  : `Pagar ${"\u20AC"}${purchaseAmount}`
                }
              </Button>
              <p className="text-xs text-center text-muted-foreground">Processado de forma segura</p>
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
