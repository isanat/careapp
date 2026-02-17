"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconLogo, 
  IconToken, 
  IconShield, 
  IconWallet,
  IconCheck,
  IconAlert,
  IconExternalLink
} from "@/components/icons";
import { APP_NAME, TOKEN_NAME, TOKEN_SYMBOL, ACTIVATION_COST_EUR_CENTS } from "@/lib/constants";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const cancelled = searchParams.get("cancelled");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(cancelled ? "Pagamento cancelado. Tente novamente." : "");

  useEffect(() => {
    if (!userId) {
      router.push("/auth/register");
    }
  }, [userId, router]);

  const handlePayment = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar sessão de pagamento");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  const tokensReceived = ACTIVATION_COST_EUR_CENTS; // 1:1 conversion

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mx-auto">
            <IconLogo className="h-10 w-10 text-primary" />
          </Link>
          <div>
            <CardTitle className="text-2xl">Ativar sua Conta</CardTitle>
            <CardDescription>
              Complete o pagamento para ativar sua conta e receber seus tokens
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <IconAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de Ativação</span>
              <Badge variant="secondary">€{ACTIVATION_COST_EUR_CENTS / 100}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tokens Recebidos</span>
              <Badge className="bg-primary">
                <IconToken className="h-3 w-3 mr-1" />
                {tokensReceived} {TOKEN_SYMBOL}
              </Badge>
            </div>
          </div>

          {/* What you get */}
          <div className="space-y-3">
            <p className="font-medium">O que você recebe:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <IconCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Conta Ativada</p>
                  <p className="text-sm text-muted-foreground">Acesso completo à plataforma</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconWallet className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Carteira Digital</p>
                  <p className="text-sm text-muted-foreground">Criada automaticamente com seu saldo inicial</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconToken className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{tokensReceived} {TOKEN_SYMBOL} Tokens</p>
                  <p className="text-sm text-muted-foreground">Para usar em contratos e gorjetas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <IconShield className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Pagamento Seguro</p>
              <p className="text-muted-foreground">Processado por Stripe</p>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : `Pagar €${ACTIVATION_COST_EUR_CENTS / 100} e Ativar`}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos{" "}
            <Link href="/termos" className="underline hover:text-foreground">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/privacidade" className="underline hover:text-foreground">
              Política de Privacidade
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12 text-center">
            <p>Carregando...</p>
          </CardContent>
        </Card>
      </main>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
