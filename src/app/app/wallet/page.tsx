"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [purchaseAmount, setPurchaseAmount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  if (status === "loading") {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </AppShell>
    );
  }

  // Mock data
  const wallet = {
    address: "0x7a3d...9f2e",
    fullAddress: "0x7a3d2c4e8f1b5a6d9c3e7f2a4b8d1c6e5f9a2b3c",
    balanceTokens: 2500,
    balanceEur: 25.0,
    tokenPrice: 0.01, // €0.01 per token
  };

  const transactions = [
    { id: 1, type: "credit", reason: "Ativação de conta", tokens: 2500, date: "2024-01-15" },
    { id: 2, type: "debit", reason: "Taxa de contrato #1234", tokens: -500, date: "2024-01-14" },
    { id: 3, type: "credit", reason: "Gorjeta recebida", tokens: 200, date: "2024-01-13" },
    { id: 4, type: "debit", reason: "Taxa de contrato #1235", tokens: -500, date: "2024-01-12" },
    { id: 5, type: "credit", reason: "Bônus de indicação", tokens: 100, date: "2024-01-10" },
  ];

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.fullAddress);
    // Show toast
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    // In real app, call API to create Stripe checkout
    setTimeout(() => {
      setIsProcessing(false);
      // Redirect to Stripe
    }, 1000);
  };

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
                    <p className="text-sm text-muted-foreground">≈ €{wallet.balanceEur.toFixed(2)}</p>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <code className="text-xs text-muted-foreground flex-1 truncate">
                    {wallet.fullAddress}
                  </code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                    <IconCopy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a 
                      href={`https://polygonscan.com/address/${wallet.fullAddress}`}
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
                          <p className="font-medium">{tx.reason}</p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
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
