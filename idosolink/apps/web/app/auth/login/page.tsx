'use client';

import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

interface LoginForm {
  email: string;
}

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginForm>();

  const onSubmit = handleSubmit((data) => {
    alert(`Magic link enviado para ${data.email}. (stub)`);
  });

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-md mx-auto glass-card p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-slate-300">Receba um link mágico para acessar sua conta.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">Email</label>
          <Input
            type="email"
            placeholder="voce@email.com"
            {...register('email', { required: true })}
          />
          <Button className="w-full" type="submit">
            Enviar link
          </Button>
        </form>
        <Link href="/onboarding" className="text-accent text-sm">
          Não tem conta? Comece aqui
        </Link>
      </div>
    </main>
  );
}
