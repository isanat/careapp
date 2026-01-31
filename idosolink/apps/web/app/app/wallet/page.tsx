'use client';

import { useState } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';

export default function WalletPage() {
  const [buyOpen, setBuyOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);

  return (
    <div className="space-y-6">
      <section className="glass-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Minha carteira IdosoLink</h1>
          <p className="text-slate-300">Saldo atual: 420 tokens · €42 equivalente</p>
          <p className="text-sm text-slate-400">Modo simples ativo. Alternar para avançado em Configurações.</p>
        </div>
        <img src="/assets/token.svg" alt="Token IdosoLink" className="w-28" />
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        <button className="glass-card p-4 text-left" onClick={() => setBuyOpen(true)}>
          <h3 className="font-semibold">Comprar tokens</h3>
          <p className="text-slate-300">€5, €25 ou valor livre via Stripe.</p>
        </button>
        <button className="glass-card p-4 text-left" onClick={() => setTipOpen(true)}>
          <h3 className="font-semibold">Enviar gorjeta</h3>
          <p className="text-slate-300">Reconheça cuidadores com bônus em token.</p>
        </button>
        <button className="glass-card p-4 text-left" onClick={() => setRedeemOpen(true)}>
          <h3 className="font-semibold">Converter tokens</h3>
          <p className="text-slate-300">Solicite resgate para euro com burn automático.</p>
        </button>
      </div>

      <Card title="Histórico">
        <ul className="space-y-2 text-slate-300">
          <li>+250 tokens · Ativação €25</li>
          <li>-50 tokens · Taxa contrato #c1</li>
          <li>+20 tokens · Gorjeta contrato #c2</li>
        </ul>
      </Card>

      <Modal open={buyOpen} title="Comprar tokens" onClose={() => setBuyOpen(false)}>
        <p className="text-slate-300">Escolha o valor em euros para converter automaticamente em tokens.</p>
        <button className="w-full rounded-full bg-accent py-3 text-slate-900 font-semibold">Ir para Stripe</button>
      </Modal>

      <Modal open={tipOpen} title="Enviar gorjeta" onClose={() => setTipOpen(false)}>
        <p className="text-slate-300">Selecione o contrato e o valor em tokens.</p>
        <button className="w-full rounded-full bg-accent py-3 text-slate-900 font-semibold">Enviar gorjeta</button>
      </Modal>

      <Modal open={redeemOpen} title="Converter tokens" onClose={() => setRedeemOpen(false)}>
        <p className="text-slate-300">Tokens serão queimados após a conversão para euro.</p>
        <button className="w-full rounded-full bg-accent py-3 text-slate-900 font-semibold">Solicitar resgate</button>
      </Modal>
    </div>
  );
}
