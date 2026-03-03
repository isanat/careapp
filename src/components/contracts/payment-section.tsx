"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconEuro,
  IconCreditCard,
  IconSmartphone,
  IconBuilding,
  IconCheck,
  IconAlert,
  IconLoader2,
} from "@/components/icons";
import { CONTRACT_FEE_EUR_CENTS } from "@/lib/constants";

type PaymentMethod = "cc" | "mbway" | "multibanco";

interface PaymentSectionProps {
  contractId: string;
  onPaymentSuccess?: () => void;
}

interface PaymentResult {
  success: boolean;
  method: PaymentMethod;
  paymentId: string;
  easypayUid?: string;
  creditcard?: {
    url?: string;
  };
  multibanco?: {
    entity?: string;
    reference?: string;
  };
  mbway?: {
    alias?: string;
  };
}

export function PaymentSection({ contractId, onPaymentSuccess }: PaymentSectionProps) {
  const [method, setMethod] = useState<PaymentMethod>("cc");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const feeEur = (CONTRACT_FEE_EUR_CENTS / 100).toFixed(2);

  const handleSubmit = async () => {
    setError(null);

    if (method === "mbway" && !phone.trim()) {
      setError("Introduza o número de telemóvel para pagamento MBWay.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payments/contract-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          method,
          ...(method === "mbway" ? { phone: phone.trim() } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar pagamento");
      }

      setPaymentResult(data);

      // For credit card, redirect to payment URL
      if (method === "cc" && data.creditcard?.url) {
        window.location.href = data.creditcard.url;
        return;
      }

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar pagamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success/confirmation state
  if (paymentResult) {
    return (
      <Card className="border-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCheck className="h-5 w-5 text-green-500" />
            Pagamento Iniciado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentResult.method === "multibanco" && paymentResult.multibanco && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Utilize os dados abaixo para efetuar o pagamento por Multibanco:
              </p>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Entidade:</span>
                  <span className="font-mono font-bold">
                    {paymentResult.multibanco.entity || "---"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Referência:</span>
                  <span className="font-mono font-bold">
                    {paymentResult.multibanco.reference || "---"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Montante:</span>
                  <span className="font-mono font-bold">{feeEur} EUR</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                O pagamento será processado automaticamente após a confirmação.
              </p>
            </div>
          )}

          {paymentResult.method === "mbway" && (
            <div className="space-y-3 text-center">
              <IconSmartphone className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Foi enviado um pedido de pagamento para o seu telemóvel via MBWay.
                Aceite o pagamento na aplicação MBWay.
              </p>
              <p className="text-xs text-muted-foreground">
                O contrato será ativado automaticamente após a confirmação do pagamento.
              </p>
            </div>
          )}

          {paymentResult.method === "cc" && (
            <div className="space-y-3 text-center">
              <IconCreditCard className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                A redirecionar para a página de pagamento...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconEuro className="h-5 w-5 text-orange-500" />
          Pagamento da Taxa de Contrato
        </CardTitle>
        <CardDescription>
          Ambas as partes aceitaram o contrato. Pague a taxa de contrato para ativar o serviço.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fee Amount */}
        <div className="bg-muted rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Taxa de contrato</p>
          <p className="text-3xl font-bold text-primary">{feeEur} EUR</p>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <Label htmlFor="payment-method">Método de Pagamento</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
            <SelectTrigger className="w-full" id="payment-method">
              <SelectValue placeholder="Selecione o método de pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cc">
                <div className="flex items-center gap-2">
                  <IconCreditCard className="h-4 w-4" />
                  Cartão de Crédito/Débito
                </div>
              </SelectItem>
              <SelectItem value="mbway">
                <div className="flex items-center gap-2">
                  <IconSmartphone className="h-4 w-4" />
                  MBWay
                </div>
              </SelectItem>
              <SelectItem value="multibanco">
                <div className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4" />
                  Multibanco
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Phone Input (for MBWay) */}
        {method === "mbway" && (
          <div className="space-y-2">
            <Label htmlFor="mbway-phone">Número de Telemóvel</Label>
            <Input
              id="mbway-phone"
              type="tel"
              placeholder="912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">
              Introduza o número associado à sua conta MBWay.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <IconAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              A processar...
            </>
          ) : (
            <>
              <IconEuro className="h-4 w-4 mr-2" />
              Pagar {feeEur} EUR
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
