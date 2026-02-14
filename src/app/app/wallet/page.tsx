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
  IconRefresh
} from "@/components/icons";
import { TOKEN_NAME, TOKEN_SYMBOL } from "@/lib/constants";

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
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseAmount, setPurchaseAmount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);

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
    }
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    // In real app, call API to create Stripe checkout
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
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
          <h2 className="text-xl font-semibold mb-2">Carteira não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            Sua carteira será criada após a ativação da conta.
          </p>
          <Button asChild>
            <Link href="/auth/payment">Ativar Conta</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const balanceEur = (wallet.balanceTokens * 0.01).toFixed(2);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Minha Carteira</h1>
          <p className="text-muted-foreground">Gerencie seus tokens e transações</p>
        </div>

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
                    <p className="text-sm text-muted-foreground">Saldo {TOKEN_SYMBOL}</p>
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
                    <IconCopy className="h-4 w-4" />
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
                <Button size="lg" onClick={handlePurchase}>
                  <IconEuro className="h-4 w-4 mr-2" />
                  Comprar Tokens
                </Button>
                <Button size="lg" variant="outline">
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Vender Tokens
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
                  <p className="text-sm text-muted-foreground">Preço Atual</p>
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
                  <p className="text-sm text-muted-foreground">Tokens em Circulação</p>
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
                  <p className="text-sm text-muted-foreground">Reserva Total</p>
                  <p className="text-xl font-bold">€12,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="purchase">Comprar Tokens</TabsTrigger>
            <TabsTrigger value="sell">Vender Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>
                  Todas as movimentações de tokens na sua carteira
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
                              tx.type === "credit"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {tx.type === "credit" ? (
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
                          variant={tx.type === "credit" ? "default" : "secondary"}
                          className={tx.type === "credit" ? "bg-green-500" : ""}
                        >
                          {tx.type === "credit" ? "+" : ""}
                          {tx.tokens} {TOKEN_SYMBOL}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconWallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma transação encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Comprar Tokens</CardTitle>
                <CardDescription>
                  Compre {TOKEN_SYMBOL} tokens usando Euro via Stripe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Valor em Euro</Label>
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
                    <span className="text-muted-foreground">Tokens recebidos</span>
                    <span className="font-medium">{purchaseAmount * 100} {TOKEN_SYMBOL}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa</span>
                    <span className="font-medium">€0</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>€{purchaseAmount}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processando..." : `Pagar €${purchaseAmount}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Pagamento processado de forma segura via Stripe
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sell" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vender Tokens</CardTitle>
                <CardDescription>
                  Converta seus {TOKEN_SYMBOL} tokens em Euro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm">
                    <strong>Importante:</strong> Ao vender tokens, eles são queimados permanentemente.
                    Isso reduz a oferta e pode aumentar o valor dos tokens restantes.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade de Tokens</Label>
                  <Input
                    type="number"
                    min={100}
                    max={wallet.balanceTokens}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Saldo disponível: {wallet.balanceTokens.toLocaleString()} {TOKEN_SYMBOL}
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de câmbio</span>
                    <span className="font-medium">€0.01 por {TOKEN_SYMBOL}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Você recebe</span>
                    <span className="font-medium">€0.00</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" size="lg">
                  Solicitar Resgate
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Resgates são processados em até 3 dias úteis
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
