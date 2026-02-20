"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  IconSmartphone, 
  IconBuilding, 
  IconCreditCard, 
  IconLoader2,
  IconCheck,
  IconAlert,
  IconCopy,
  IconExternalLink
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

type PaymentMethod = 'mbway' | 'multibanco' | 'cc' | 'stripe';

interface PaymentMethodSelectorProps {
  amount: number;
  description: string;
  type?: 'activation' | 'tokens' | 'contract';
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function PaymentMethodSelector({ 
  amount, 
  description,
  type = 'activation',
  onSuccess, 
  onError 
}: PaymentMethodSelectorProps) {
  const { t } = useI18n();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mbway');
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [nif, setNif] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setIsLoading(true);
    setError('');
    setPaymentResult(null);

    try {
      // For Easypay methods
      if (['mbway', 'multibanco', 'cc'].includes(selectedMethod)) {
        const response = await fetch('/api/payments/easypay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            method: selectedMethod,
            amount: amount,
            phone: selectedMethod === 'mbway' ? phone : undefined,
            nif: selectedMethod === 'multibanco' ? nif : undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Payment failed');
        }

        setPaymentResult(data);
        onSuccess?.(data);

        // For credit card, redirect to payment page
        if (selectedMethod === 'cc' && data.creditcard?.url) {
          window.location.href = data.creditcard.url;
        }
      } else {
        // For Stripe
        const response = await fetch('/api/payments/activation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Payment failed');
        }

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">{t.payment?.selectMethod || "Escolha o método de pagamento"}</h3>
        
        <RadioGroup value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as PaymentMethod)}>
          {/* MB Way */}
          <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
               onClick={() => setSelectedMethod('mbway')}>
            <RadioGroupItem value="mbway" id="mbway" />
            <div className="flex-1">
              <Label htmlFor="mbway" className="flex items-center gap-2 cursor-pointer">
                <IconSmartphone className="h-5 w-5 text-green-600" />
                <span className="font-medium">MB Way</span>
              </Label>
              <p className="text-sm text-muted-foreground ml-7">
                Pague com o seu telemóvel em segundos
              </p>
            </div>
          </div>

          {/* Multibanco */}
          <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
               onClick={() => setSelectedMethod('multibanco')}>
            <RadioGroupItem value="multibanco" id="multibanco" />
            <div className="flex-1">
              <Label htmlFor="multibanco" className="flex items-center gap-2 cursor-pointer">
                <IconBuilding className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Referência Multibanco</span>
              </Label>
              <p className="text-sm text-muted-foreground ml-7">
                Receba uma referência para pagar no Multibanco
              </p>
            </div>
          </div>

          {/* Credit Card */}
          <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
               onClick={() => setSelectedMethod('cc')}>
            <RadioGroupItem value="cc" id="cc" />
            <div className="flex-1">
              <Label htmlFor="cc" className="flex items-center gap-2 cursor-pointer">
                <IconCreditCard className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Cartão de Crédito/Débito</span>
              </Label>
              <p className="text-sm text-muted-foreground ml-7">
                Visa, Mastercard, American Express
              </p>
            </div>
          </div>

          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground text-center">
            {t.payment?.or || "ou"}
          </p>

          {/* Stripe (International) */}
          <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
               onClick={() => setSelectedMethod('stripe')}>
            <RadioGroupItem value="stripe" id="stripe" />
            <div className="flex-1">
              <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer">
                <IconCreditCard className="h-5 w-5 text-indigo-600" />
                <span className="font-medium">Stripe (Internacional)</span>
              </Label>
              <p className="text-sm text-muted-foreground ml-7">
                Para pagamentos fora de Portugal
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Additional Fields */}
      {selectedMethod === 'mbway' && (
        <div className="space-y-2">
          <Label htmlFor="phone">Número de telemóvel (MB Way)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="912 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Introduza o número associado à sua conta MB Way
          </p>
        </div>
      )}

      {selectedMethod === 'multibanco' && (
        <div className="space-y-2">
          <Label htmlFor="nif">NIF (opcional)</Label>
          <Input
            id="nif"
            type="text"
            placeholder="123456789"
            value={nif}
            onChange={(e) => setNif(e.target.value)}
            maxLength={9}
          />
          <p className="text-xs text-muted-foreground">
            Para faturação
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <IconAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payment Result - MB Way */}
      {paymentResult && selectedMethod === 'mbway' && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6 text-center">
            <IconSmartphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Verifique o seu telemóvel</h3>
            <p className="text-muted-foreground mb-4">
              Abra a app MB Way e confirme o pagamento de <strong>€{amount.toFixed(2)}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              ID: {paymentResult.mbway?.requestId}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Result - Multibanco */}
      {paymentResult && selectedMethod === 'multibanco' && paymentResult.multibanco && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-center">Referência Multibanco</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Entidade</p>
                <p className="text-2xl font-bold">{paymentResult.multibanco.entity}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => copyToClipboard(paymentResult.multibanco.entity)}
                >
                  <IconCopy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Referência</p>
                <p className="text-2xl font-bold">{paymentResult.multibanco.reference}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => copyToClipboard(paymentResult.multibanco.reference)}
                >
                  <IconCopy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
            </div>
            <div className="p-4 bg-background rounded-lg border text-center">
              <p className="text-sm text-muted-foreground mb-1">Valor</p>
              <p className="text-3xl font-bold text-primary">€{paymentResult.multibanco.amount.toFixed(2)}</p>
            </div>
            {paymentResult.multibanco.expiresAt && (
              <p className="text-xs text-muted-foreground text-center">
                Válida até: {new Date(paymentResult.multibanco.expiresAt).toLocaleString('pt-PT')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Result - Credit Card */}
      {paymentResult && selectedMethod === 'cc' && paymentResult.creditcard && (
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-6 text-center">
            <IconCreditCard className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">A redirecionar...</h3>
            <p className="text-muted-foreground mb-4">
              Será redirecionado para a página de pagamento segura
            </p>
            {paymentResult.creditcard.url && (
              <Button asChild>
                <a href={paymentResult.creditcard.url} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink className="h-4 w-4 mr-2" />
                  Ir para página de pagamento
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pay Button */}
      {!paymentResult && (
        <Button 
          className="w-full" 
          size="lg"
          onClick={handlePayment}
          disabled={isLoading || (selectedMethod === 'mbway' && phone.length < 9)}
        >
          {isLoading ? (
            <>
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.loading}
            </>
          ) : (
            <>
              {t.payment?.proceed || "Pagar"} €{amount.toFixed(2)}
            </>
          )}
        </Button>
      )}

      {/* Amount Summary */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{description}</span>
          <span className="font-bold text-lg">€{amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <IconCheck className="h-4 w-4 text-green-600" />
        <span>Pagamento seguro processado por Easypay</span>
      </div>
    </div>
  );
}

export default PaymentMethodSelector;
