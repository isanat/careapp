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
import { useI18n } from "@/lib/i18n";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const cancelled = searchParams.get("cancelled");
  const { t } = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(cancelled ? t.payment.paymentCancelled : "");

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
        throw new Error(data.error || t.payment.paymentError);
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.payment.genericError);
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
            <CardTitle className="text-2xl">{t.payment.title}</CardTitle>
            <CardDescription>
              {t.payment.description}
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
              <span className="text-muted-foreground">{t.payment.activationFee}</span>
              <Badge variant="secondary">€{ACTIVATION_COST_EUR_CENTS / 100}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t.payment.tokensReceived}</span>
              <Badge className="bg-primary">
                <IconToken className="h-3 w-3 mr-1" />
                {tokensReceived} {TOKEN_SYMBOL}
              </Badge>
            </div>
          </div>

          {/* What you get */}
          <div className="space-y-3">
            <p className="font-medium">{t.payment.features}</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <IconCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{t.payment.accountActivated}</p>
                  <p className="text-sm text-muted-foreground">{t.payment.accountActivatedDesc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconWallet className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{t.payment.walletCreated}</p>
                  <p className="text-sm text-muted-foreground">{t.payment.walletCreatedDesc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconToken className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{tokensReceived} {TOKEN_SYMBOL} Tokens</p>
                  <p className="text-sm text-muted-foreground">{t.payment.tokensForUse}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <IconShield className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium">{t.payment.securePayment}</p>
              <p className="text-muted-foreground">{t.payment.processedByStripe}</p>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? t.payment.processing : `${t.payment.proceed} €${ACTIVATION_COST_EUR_CENTS / 100}`}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            {t.payment.terms}{" "}
            <Link href="/termos" className="underline hover:text-foreground">
              {t.footer.terms}
            </Link>{" "}
            {t.payment.and}{" "}
            <Link href="/privacidade" className="underline hover:text-foreground">
              {t.footer.privacy}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function PaymentPage() {
  const { t } = useI18n();
  
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12 text-center">
            <p>{t.loading}</p>
          </CardContent>
        </Card>
      </main>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
