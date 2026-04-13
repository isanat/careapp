'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input, Label } from '../../../components/ui/input';
import { useAppStore } from '../../store';

interface CaregiverForm {
  name: string;
  city: string;
  hourlyRate: number;
  services: string;
  availability: string;
}

export default function CaregiverOnboardingPage() {
  const { register, handleSubmit } = useForm<CaregiverForm>();
  const setRole = useAppStore((state) => state.setRole);

  const onSubmit = handleSubmit(() => {
    setRole('CUIDADOR');
    alert('Cadastro salvo! Agora ative sua conta.');
  });

  return (
    <main className="min-h-screen bg-bg">
      <div className="container-page py-12">
        <Card>
          <CardHeader>
            <CardTitle>Cadastro do cuidador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="Nome completo" {...register('name')} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input placeholder="Cidade" {...register('city')} />
              </div>
              <div className="space-y-2">
                <Label>Preço/hora</Label>
                <Input type="number" placeholder="€ 25" {...register('hourlyRate')} />
              </div>
              <div className="space-y-2">
                <Label>Serviços</Label>
                <Input placeholder="Companhia, mobilidade, medicação" {...register('services')} />
              </div>
              <div className="space-y-2">
                <Label>Disponibilidade</Label>
                <Input placeholder="Seg-Sex · 08h-18h" {...register('availability')} />
              </div>
              <Button className="w-full" type="submit">
                Salvar e ativar
              </Button>
            </form>
            <Link href="/app/activation" className="text-sm text-primary">
              Ir para ativação
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
