'use client';

import { useState } from 'react';
import { Modal } from '../../../../components/Modal';
import { Card } from '../../../../components/Card';

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="section-title">Contrato #{params.id}</h1>
      <Card title="Resumo">
        <p className="text-slate-300">Carga: 20h/sem · €18/hora · Comissão 15%</p>
        <p className="text-slate-300">Tarefas: Higiene, Medicação, Companhia</p>
      </Card>
      <Card title="Chat">
        <div className="space-y-3 text-slate-300">
          <p><strong>Familiar:</strong> Precisamos de ajuda noturna.</p>
          <p><strong>Cuidador:</strong> Posso começar na próxima semana.</p>
        </div>
      </Card>
      <button onClick={() => setOpen(true)} className="rounded-full bg-accent px-6 py-3 text-slate-900 font-semibold">
        Aceitar contrato
      </button>

      <Modal open={open} title="Confirmar aceite" onClose={() => setOpen(false)}>
        <p className="text-slate-300">
          Ao aceitar, registraremos o hash do contrato na blockchain e o status será atualizado para ativo.
        </p>
        <button className="w-full rounded-full bg-accent py-3 text-slate-900 font-semibold" onClick={() => setOpen(false)}>
          Confirmar aceite
        </button>
      </Modal>
    </div>
  );
}
