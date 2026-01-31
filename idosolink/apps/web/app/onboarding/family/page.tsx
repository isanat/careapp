'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input, Label } from '../../../components/ui/input';
import { useAppStore } from '../../store';

interface FamilyForm {
  name: string;
  city: string;
  elderInfo: string;
  emergencyContact: string;
}

export default function FamilyOnboardingPage() {
  const { register, handleSubmit } = useForm<FamilyForm>();
  const setRole = useAppStore((state) => state.setRole);

  const onSubmit = handleSubmit(() => {
    setRole('FAMILIAR');
    alert('Cadastro salvo! Agora ative sua conta.');
  });

  return (
    <main className="min-h-screen bg-bg">
      <div className="container-page py-12">
        <Card>
          <CardHeader>
            <CardTitle>Cadastro familiar</CardTitle>
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
                <Label>Informações do idoso</Label>
                <Input placeholder="Rotina, cuidados e preferências" {...register('elderInfo')} />
              </div>
              <div className="space-y-2">
                <Label>Contato de emergência</Label>
                <Input placeholder="Telefone de referência" {...register('emergencyContact')} />
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
