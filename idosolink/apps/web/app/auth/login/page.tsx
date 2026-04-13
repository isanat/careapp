'use client';

import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Input, Label } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

interface LoginForm {
  email: string;
}

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginForm>();

  const onSubmit = handleSubmit((data) => {
    alert(`Link enviado para ${data.email}. (stub)`);
  });

  return (
    <main className="min-h-screen bg-bg">
      <div className="container-page py-12">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text2">Receba um link mágico para acessar sua conta.</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="voce@email.com" {...register('email', { required: true })} />
              </div>
              <Button className="w-full" type="submit">
                Enviar link
              </Button>
            </form>
            <Link href="/onboarding" className="text-sm text-primary">
              Não tem conta? Comece aqui
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
