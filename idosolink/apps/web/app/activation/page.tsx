'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';

export default function ActivationPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleActivation = async () => {
    setLoading(true);
    setStatus('Gerando checkout de ativação...');
    const response = await fetch('/api/payments/activation', { method: 'POST' });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setStatus('Erro ao criar checkout. Verifique as chaves Stripe.');
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-xl mx-auto glass-card p-8 space-y-4">
        <h1 className="text-2xl font-semibold">Ativação da conta</h1>
        <p className="text-slate-300">
          Para ativar sua conta, faça o pagamento único de €25. O valor é convertido automaticamente em tokens e
          creditado em sua carteira IdosoLink.
        </p>
        <Button
          onClick={handleActivation}
          disabled={loading}
        >
          {loading ? 'Aguarde...' : 'Ativar conta por €25'}
        </Button>
        <p className="text-sm text-slate-400">{status}</p>
      </div>
    </main>
  );
}
