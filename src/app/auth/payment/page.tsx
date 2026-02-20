"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  IconLogo, 
  IconToken, 
  IconShield, 
  IconWallet,
  IconCheck,
  IconAlert,
  IconLoader2,
  IconSmartphone,
  IconBuilding,
  IconCreditCard
} from "@/components/icons";
import { APP_NAME, TOKEN_NAME, TOKEN_SYMBOL, ACTIVATION_COST_EUR_CENTS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const userId = searchParams.get("userId");
  const cancelled = searchParams.get("cancelled");
  const { t } = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(cancelled ? t.payment.paymentCancelled : "");
  const [paymentMethod, setPaymentMethod] = useState<"mbway" | "multibanco" | "cc">("multibanco");
  const [phone, setPhone] = useState("");
  const [nif, setNif] = useState("");
  
  // Payment result states
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    method: string;
    mbway?: { requestId: string; alias: string };
    multibanco?: { entity: string; reference: string; amount: number; expiresAt: string };
    creditcard?: { url: string };
  } | null>(null);

  useEffect(() => {
    // If not logged in and no userId, redirect to register
    if (status === "unauthenticated" && !userId) {
      router.push("/auth/register");
    }
  }, [status, userId, router]);

  const handlePayment = async () => {
    if (!userId && !session?.user?.id) {
      setError("User ID is required");
      return;
    }

    if (paymentMethod === "mbway" && !phone) {
      setError("Phone number is required for MB Way");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/easypay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: userId || session?.user?.id,
          type: "activation",
          method: paymentMethod,
          amount: ACTIVATION_COST_EUR_CENTS / 100,
          phone: paymentMethod === "mbway" ? phone : undefined,
          nif: paymentMethod === "multibanco" ? nif : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error status codes
        if (response.status === 503) {
          throw new Error(data.error || "Pagamento temporariamente indisponível. Por favor, tente novamente mais tarde ou entre em contato com o suporte.");
        }
        throw new Error(data.error || t.payment.paymentError);
      }

      // Handle different payment methods
      if (paymentMethod === "cc" && data.creditcard?.url) {
        // Redirect to credit card payment page
        window.location.href = data.creditcard.url;
      } else {
        // Show payment result (MB Way or Multibanco)
        setPaymentResult({
          success: true,
          method: paymentMethod,
          mbway: data.mbway,
          multibanco: data.multibanco,
          creditcard: data.creditcard,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.payment.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  const tokensReceived = ACTIVATION_COST_EUR_CENTS; // 1:1 conversion

  // Show payment result after successful payment creation
  if (paymentResult?.success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center space-y-4">
            <div className="inline-flex items-center justify-center gap-2 mx-auto">
              <IconCheck className="h-12 w-12 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-2xl text-green-600">{t.payment.paymentCreated}</CardTitle>
              <CardDescription>{t.payment.followInstructions}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentResult.method === "mbway" && paymentResult.mbway && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <IconSmartphone className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="font-medium">MB Way</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t.payment.checkPhone} <strong>{paymentResult.mbway.alias}</strong>
                </p>
              </div>
            )}

            {paymentResult.method === "multibanco" && paymentResult.multibanco && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <IconBuilding className="h-6 w-6 text-orange-500" />
                  <span className="font-medium">Multibanco</span>
                </div>
                <div className="space-y-3 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Entidade</p>
                    <p className="text-2xl font-bold">{paymentResult.multibanco.entity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Referência</p>
                    <p className="text-2xl font-bold tracking-wider">{paymentResult.multibanco.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-xl font-bold">€{(paymentResult.multibanco.amount / 100).toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  {t.payment.expiresAt}: {new Date(paymentResult.multibanco.expiresAt).toLocaleDateString('pt-PT')}
                </p>
              </div>
            )}

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                {t.payment.afterPayment}
              </p>
            </div>

            <Button 
              className="w-full" 
              onClick={() => router.push("/app/dashboard")}
              variant="outline"
            >
              {t.dashboard.title}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

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

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>{t.payment.selectMethod}</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
              <div className="grid gap-3">
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  paymentMethod === "multibanco" ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}>
                  <RadioGroupItem value="multibanco" />
                  <IconBuilding className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Multibanco</p>
                    <p className="text-xs text-muted-foreground">{t.payment.multibancoDesc}</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  paymentMethod === "mbway" ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}>
                  <RadioGroupItem value="mbway" />
                  <IconSmartphone className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">MB Way</p>
                    <p className="text-xs text-muted-foreground">{t.payment.mbwayDesc}</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  paymentMethod === "cc" ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}>
                  <RadioGroupItem value="cc" />
                  <IconCreditCard className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">{t.payment.creditCard}</p>
                    <p className="text-xs text-muted-foreground">{t.payment.creditCardDesc}</p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Additional fields based on method */}
          {paymentMethod === "mbway" && (
            <div className="space-y-2">
              <Label htmlFor="phone">{t.auth.phone}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+351 912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t.payment.mbwayPhoneHint}</p>
            </div>
          )}

          {paymentMethod === "multibanco" && (
            <div className="space-y-2">
              <Label htmlFor="nif">NIF {t.payment.optional}</Label>
              <Input
                id="nif"
                type="text"
                placeholder="123456789"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                maxLength={9}
              />
              <p className="text-xs text-muted-foreground">{t.payment.nifHint}</p>
            </div>
          )}

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
              <p className="text-muted-foreground">{t.payment.processedByEasypay}</p>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.payment.processing}
              </>
            ) : (
              `${t.payment.proceed} €${ACTIVATION_COST_EUR_CENTS / 100}`
            )}
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
