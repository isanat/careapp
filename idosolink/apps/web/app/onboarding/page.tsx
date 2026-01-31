'use client';

import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppStore } from '../store';
import { IconCaregiver, IconFamily } from '../../components/icons';

export default function OnboardingPage() {
  const router = useRouter();
  const setRole = useAppStore((state) => state.setRole);

  const handleSelect = (role: 'FAMILIAR' | 'CUIDADOR') => {
    setRole(role);
    router.push('/app/activation');
  };

  return (
    <main className="min-h-screen bg-bg">
      <div className="container-page space-y-10 py-12">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Onboarding</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Escolha o perfil ideal para você</h1>
          <p className="text-text2">
            Vamos ajustar o IdosoLink para a sua rotina. Você poderá alternar depois nas configurações.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sou Familiar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <IconFamily className="h-6 w-6" />
                <p className="text-sm text-text2">Encontre cuidadores verificados e organize o cuidado.</p>
              </div>
              <Button className="w-full" onClick={() => handleSelect('FAMILIAR')}>
                Continuar como Familiar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sou Cuidador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <IconCaregiver className="h-6 w-6" />
                <p className="text-sm text-text2">Gerencie agenda, propostas e pagamentos com clareza.</p>
              </div>
              <Button variant="secondary" className="w-full" onClick={() => handleSelect('CUIDADOR')}>
                Continuar como Cuidador
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
