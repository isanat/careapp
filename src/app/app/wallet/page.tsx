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
  IconToken, 
  IconWallet, 
  IconArrowUp, 
  IconArrowDown,
  IconCopy,
  IconEuro,
  IconRefresh,
  IconCheck,
  IconLoader2,
  IconAlert
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

interface Wallet {
  id: string;
  address: string;
  balanceTokens: number;
  balanceEurCents: number;
}

interface Transaction {
  id: string;
  type: string;
  reason: string;
  tokens: number;
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
  const [sellAmount, setSellAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const handleSell = async () => {
    if (!wallet || sellAmount > wallet.balanceTokens) {
      setError("Saldo insuficiente");
      return;
    }
    setIsProcessing(true);
    alert(`Venda de ${sellAmount} créditos solicitada. Processamento em 3 dias úteis.`);
    setIsProcessing(false);
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

  const balanceEur = (wallet.balanceTokens * 0.01).toFixed(2);

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background border-b">
          <h1 className="text-lg font-semibold">{t.wallet.title}</h1>
          <Badge variant="outline" className="text-xs">€0.01/token</Badge>
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
                <IconToken className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{wallet.balanceTokens.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">≈ €{balanceEur}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handlePurchase} disabled={isProcessing}>
                {isProcessing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconEuro className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={handleSell} disabled={isProcessing}>
                <IconRefresh className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <code className="text-[10px] text-muted-foreground flex-1 truncate bg-background/50 px-2 py-1 rounded">{wallet.address}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
              {copied ? <IconCheck className="h-3 w-3 text-green-500" /> : <IconCopy className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="px-4">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="history" className="text-xs py-1.5">Histórico</TabsTrigger>
            <TabsTrigger value="purchase" className="text-xs py-1.5">Comprar</TabsTrigger>
            <TabsTrigger value="sell" className="text-xs py-1.5">Vender</TabsTrigger>
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
                    {tx.type === "CREDIT" ? "+" : "-"}{tx.tokens}
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

          <TabsContent value="purchase" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">€</span>
              <Input type="number" min={10} max={1000} value={purchaseAmount} onChange={(e) => setPurchaseAmount(Number(e.target.value))} className="h-9" />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tokens</span><span>{purchaseAmount * 100}</span></div>
              <div className="flex justify-between font-medium"><span>Total</span><span>€{purchaseAmount}</span></div>
            </div>
            <Button className="w-full h-10" onClick={handlePurchase} disabled={isProcessing}>
              {isProcessing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : `Pagar €${purchaseAmount}`}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">Processado por Stripe</p>
          </TabsContent>

          <TabsContent value="sell" className="mt-3 space-y-3">
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs">
              Tokens são queimados ao vender.
            </div>
            <div>
              <Input type="number" min={100} max={wallet.balanceTokens} value={sellAmount} onChange={(e) => setSellAmount(Number(e.target.value))} className="h-9" placeholder="Tokens" />
              <p className="text-[10px] text-muted-foreground mt-1">Disponível: {wallet.balanceTokens.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Você recebe</span><span>€{(sellAmount * 0.01).toFixed(2)}</span></div>
            </div>
            <Button variant="outline" className="w-full h-10" onClick={handleSell} disabled={isProcessing || sellAmount > wallet.balanceTokens}>
              {isProcessing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : t.wallet.sell}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">Processamento em 3 dias úteis</p>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
