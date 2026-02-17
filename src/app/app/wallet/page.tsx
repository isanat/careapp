"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconToken, 
  IconWallet, 
  IconArrowUp, 
  IconArrowDown,
  IconCopy,
  IconExternalLink,
  IconEuro,
  IconCoins,
  IconGift,
  IconRefresh,
  IconCheck,
  IconLoader2,
  IconAlert
} from "@/components/icons";
import { TOKEN_NAME, TOKEN_SYMBOL } from "@/lib/constants";
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
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchWallet();
    }
  }, [status]);

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/user/wallet');
      if (response.ok) {
        const data = await response.json();
        setWallet(data.wallet);
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
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
        body: JSON.stringify({ 
          userId: session.user.id,
          amount: purchaseAmount * 100 // Convert to cents
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error creating payment session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSell = async () => {
    if (!wallet || sellAmount > wallet.balanceTokens) {
      setError("Insufficient token balance");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // For now, show a message that sell is being processed
      // In production, this would create a sell request
      alert(`Sell request for ${sellAmount} ${TOKEN_SYMBOL} tokens submitted. Processing in 3 business days.`);
      setSellAmount(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing sell request");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </AppShell>
    );
  }

  if (!wallet) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <IconWallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">{t.wallet.title}</h2>
          <p className="text-muted-foreground mb-4">
            {t.loading}
          </p>
          <Button asChild>
            <Link href="/auth/payment">{t.auth.register}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const balanceEur = (wallet.balanceTokens * 0.01).toFixed(2);
  const sellEurAmount = (sellAmount * 0.01).toFixed(2);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t.wallet.title}</h1>
          <p className="text-muted-foreground">{t.wallet.history}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <IconAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-full">
                    <IconToken className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.wallet.balance} {TOKEN_SYMBOL}</p>
                    <p className="text-4xl font-bold">{wallet.balanceTokens.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">≈ €{balanceEur}</p>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <code className="text-xs text-muted-foreground flex-1 truncate">
                    {wallet.address}
                  </code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                    {copied ? <IconCheck className="h-4 w-4 text-green-500" /> : <IconCopy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a 
                      href={`https://polygonscan.com/address/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button size="lg" onClick={handlePurchase} disabled={isProcessing}>
                  {isProcessing ? (
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <IconEuro className="h-4 w-4 mr-2" />
                  )}
                  {t.wallet.buy}
                </Button>
                <Button size="lg" variant="outline" onClick={handleSell} disabled={isProcessing}>
                  <IconRefresh className="h-4 w-4 mr-2" />
                  {t.wallet.sell}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Info */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-full">
                  <IconArrowUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.wallet.value}</p>
                  <p className="text-xl font-bold">€0.0100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <IconCoins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Circulation</p>
                  <p className="text-xl font-bold">1.2M</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-full">
                  <IconGift className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reserve</p>
                  <p className="text-xl font-bold">€12,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">{t.wallet.history}</TabsTrigger>
            <TabsTrigger value="purchase">{t.wallet.buy}</TabsTrigger>
            <TabsTrigger value="sell">{t.wallet.sell}</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.wallet.history}</CardTitle>
                <CardDescription>
                  {t.wallet.noTransactions}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              tx.type === "CREDIT"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {tx.type === "CREDIT" ? (
                              <IconArrowUp className="h-4 w-4" />
                            ) : (
                              <IconArrowDown className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{tx.description || tx.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.date).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={tx.type === "CREDIT" ? "default" : "secondary"}
                          className={tx.type === "CREDIT" ? "bg-green-500" : ""}
                        >
                          {tx.type === "CREDIT" ? "+" : "-"}
                          {tx.tokens} {TOKEN_SYMBOL}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconWallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t.wallet.noTransactions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.wallet.buy}</CardTitle>
                <CardDescription>
                  {TOKEN_SYMBOL} - Stripe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t.wallet.value}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">€</span>
                    <Input
                      type="number"
                      min={10}
                      max={1000}
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.wallet.buy}</span>
                    <span className="font-medium">{purchaseAmount * 100} {TOKEN_SYMBOL}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-medium">€0</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>{t.all}</span>
                    <span>€{purchaseAmount}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.loading}
                    </>
                  ) : (
                    `€${purchaseAmount}`
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Stripe
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sell" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.wallet.sell}</CardTitle>
                <CardDescription>
                  {TOKEN_SYMBOL}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm">
                    <strong>Important:</strong> Tokens are burned when sold.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t.wallet.balance}</Label>
                  <Input
                    type="number"
                    min={100}
                    max={wallet.balanceTokens}
                    value={sellAmount}
                    onChange={(e) => setSellAmount(Number(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.wallet.balance}: {wallet.balanceTokens.toLocaleString()} {TOKEN_SYMBOL}
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium">€0.01 / {TOKEN_SYMBOL}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You receive</span>
                    <span className="font-medium">€{sellEurAmount}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={handleSell}
                  disabled={isProcessing || sellAmount > wallet.balanceTokens}
                >
                  {isProcessing ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.loading}
                    </>
                  ) : (
                    t.wallet.sell
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  3 business days
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
