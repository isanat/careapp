'use client';

import { useForm } from 'react-hook-form';
import Link from 'next/link';

interface CaregiverForm {
  name: string;
  city: string;
  hourlyRate: number;
  services: string;
  availability: string;
}

export default function CaregiverOnboardingPage() {
  const { register, handleSubmit } = useForm<CaregiverForm>();
  const onSubmit = handleSubmit(() => {
    alert('Cadastro salvo! Agora ative sua conta.');
  });

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-2xl mx-auto glass-card p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Cadastro Cuidador</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" placeholder="Nome" {...register('name')} />
          <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" placeholder="Cidade" {...register('city')} />
          <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" type="number" placeholder="Preço/hora (EUR)" {...register('hourlyRate')} />
          <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" placeholder="Serviços (separados por vírgula)" {...register('services')} />
          <textarea className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" placeholder="Disponibilidade" rows={3} {...register('availability')} />
          <button className="w-full rounded-full bg-accent py-3 text-slate-900 font-semibold" type="submit">
            Salvar e ativar
          </button>
        </form>
        <Link href="/activation" className="text-accent text-sm">Ir para ativação</Link>
      </div>
    </main>
  );
}
