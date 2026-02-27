"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconWallet, 
  IconArrowUp, 
  IconArrowDown,
  IconEuro,
  IconLoader2,
  IconAlert
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
  const router = useRouter();
  const { t } = useI18n();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseAmount, setPurchaseAmount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated") fetchWallet();
  }, [status]);

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/user/wallet');
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
      const response = await fetch("/api/payments/activation", {
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
        <div className="p-4 space-y-2"><div className="h-20 bg-muted rounded-lg animate-pulse" /><div className="h-32 bg-muted rounded-lg animate-pulse" /></div>
      </AppShell>
    );
  }

  if (!wallet) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <IconWallet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">Carteira não encontrada</p>
          <Button size="sm" asChild><Link href="/auth/payment">Ativar conta</Link></Button>
        </div>
      </AppShell>
    );
  }

  const balanceEur = (wallet.balanceEurCents / 100).toFixed(2);

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background border-b">
          <h1 className="text-lg font-semibold">{t.wallet.title}</h1>
        </div>

        {error && (
          <div className="mx-4 p-2 bg-red-500/10 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <IconAlert className="h-3 w-3" />{error}
          </div>
        )}

        {/* Balance */}
        <div className="mx-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <IconEuro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">€{balanceEur}</p>
                <p className="text-xs text-muted-foreground">{t.wallet.balance}</p>
              </div>
            </div>
            <Button size="sm" onClick={handlePurchase} disabled={isProcessing}>
              {isProcessing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconEuro className="h-4 w-4 mr-1" />}
              {t.wallet.addFunds || "Adicionar"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="px-4">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="history" className="text-xs py-1.5">Histórico</TabsTrigger>
            <TabsTrigger value="add" className="text-xs py-1.5">Adicionar</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-3 space-y-1">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${tx.type === "CREDIT" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {tx.type === "CREDIT" ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate max-w-[160px]">{tx.description || tx.reason}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${tx.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "CREDIT" ? "+" : "-"}€{(tx.eurCents / 100).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <IconWallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{t.wallet.noTransactions}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">€</span>
              <Input type="number" min={10} max={1000} value={purchaseAmount} onChange={(e) => setPurchaseAmount(Number(e.target.value))} className="h-9" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 100, 200].map((amount) => (
                <Button key={amount} variant="outline" size="sm" onClick={() => setPurchaseAmount(amount)}>
                  €{amount}
                </Button>
              ))}
            </div>
            <Button className="w-full h-10" onClick={handlePurchase} disabled={isProcessing}>
              {isProcessing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : `Pagar €${purchaseAmount}`}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">Processado por Stripe</p>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
