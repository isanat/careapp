'use client';

import { useForm } from 'react-hook-form';
import Link from 'next/link';

interface FamilyForm {
  name: string;
  city: string;
  elderInfo: string;
  emergencyContact: string;
}

export default function FamilyOnboardingPage() {
  const { register, handleSubmit } = useForm<FamilyForm>();
  const onSubmit = handleSubmit(() => {
    alert('Cadastro salvo! Agora ative sua conta.');
  });

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-2xl mx-auto glass-card p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Cadastro Familiar</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" placeholder="Nome" {...register('name')} />
          <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" placeholder="Cidade" {...register('city')} />
          <textarea className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" placeholder="Informações do idoso" rows={4} {...register('elderInfo')} />
          <input className="w-full rounded-lg bg-background border border-white/10 px-4 py-3" placeholder="Contato de emergência" {...register('emergencyContact')} />
          <button className="w-full rounded-full bg-accent py-3 text-slate-900 font-semibold" type="submit">
            Salvar e ativar
          </button>
        </form>
        <Link href="/activation" className="text-accent text-sm">Ir para ativação</Link>
      </div>
    </main>
  );
}
