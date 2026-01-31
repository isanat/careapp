'use client';

import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppStore } from '../store';
import { TokenAmount } from '../../components/ui/token-amount';

export default function ActivationPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const addTokens = useAppStore((state) => state.addTokens);
  const wallet = useAppStore((state) => state.wallet);

  const activationInfo = useMemo(
    () => ({ eur: 25, description: 'Ativação com €25 para criar sua carteira de créditos.' }),
    []
  );

  const handleActivation = () => {
    setLoading(true);
    setTimeout(() => {
      addTokens(activationInfo.eur, 'Ativação da conta', 'activation');
      setSuccess(true);
      setLoading(false);
    }, 800);
  };

  return (
    <main className="min-h-screen bg-bg">
      <div className="container-page py-12">
        <Card>
          <CardHeader>
            <CardTitle>Ative sua conta com tranquilidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-text2">
              A ativação é um pagamento único de €25 que cria sua carteira de créditos. Esses créditos são usados para
              taxas de contrato, bônus e gorjetas dentro do IdosoLink.
            </p>
            <Button onClick={handleActivation} disabled={loading}>
              {loading ? 'Processando...' : 'Ativar com €25'}
            </Button>
            {success ? (
              <div className="rounded-[14px] border border-border/10 bg-bg p-4">
                <p className="font-semibold text-text">Carteira criada com sucesso 🎉</p>
                <p className="text-sm text-text2">Seu saldo de créditos está disponível imediatamente.</p>
                <TokenAmount tokens={wallet.balanceTokens} euro={wallet.balanceEurEstimate} className="mt-4" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
