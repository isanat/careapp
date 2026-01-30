import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold">Escolha seu perfil</h1>
        <p className="text-slate-300">
          A jornada é personalizada. Selecione o perfil que representa você agora.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">Familiar</h2>
            <p className="text-slate-300">
              Encontre cuidadores confiáveis, crie contratos digitais e tenha total transparência no cuidado.
            </p>
            <Link href="/onboarding/family" className="text-accent">Continuar</Link>
          </div>
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">Cuidador</h2>
            <p className="text-slate-300">
              Construa sua carreira, defina preço/hora e receba bônus e gorjetas em tokens.
            </p>
            <Link href="/onboarding/caregiver" className="text-accent">Continuar</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
