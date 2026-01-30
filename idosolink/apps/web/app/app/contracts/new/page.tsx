'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';

interface ContractForm {
  caregiver: string;
  hoursPerWeek: number;
  hourlyRate: number;
  tasks: string;
  startDate: string;
  cancellation: string;
}

export default function NewContractPage() {
  const { register, handleSubmit } = useForm<ContractForm>();
  const [status, setStatus] = useState('');

  const onSubmit = handleSubmit(() => {
    setStatus('Contrato criado. Taxa de €5 em tokens aplicada aos dois lados.');
  });

  return (
    <div className="space-y-6">
      <h1 className="section-title">Nova proposta</h1>
      <form onSubmit={onSubmit} className="glass-card p-6 space-y-4">
        <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" placeholder="Cuidador" {...register('caregiver')} />
        <div className="grid md:grid-cols-2 gap-4">
          <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" type="number" placeholder="Horas/semana" {...register('hoursPerWeek')} />
          <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" type="number" placeholder="Valor/hora (EUR)" {...register('hourlyRate')} />
        </div>
        <textarea className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" rows={3} placeholder="Tarefas" {...register('tasks')} />
        <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" type="date" {...register('startDate')} />
        <textarea className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" rows={2} placeholder="Regras de cancelamento" {...register('cancellation')} />
        <button className="w-full rounded-full bg-accent py-3 text-slate-900 font-semibold" type="submit">
          Enviar proposta
        </button>
        <p className="text-sm text-accent">{status}</p>
      </form>
    </div>
  );
}
