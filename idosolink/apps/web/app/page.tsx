import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { IconCare, IconCaregiver, IconFamily, IconReputation } from '../components/icons';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg">
      <header className="container-page flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.svg" alt="IdosoLink" className="h-10 w-10" />
          <div>
            <p className="text-lg font-semibold">IdosoLink</p>
            <p className="text-sm text-text2">Cuidado com confiança</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/ui">UI Kit</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/app/ui/screens">Ver telas</Link>
          </Button>
        </div>
      </header>

      <section className="container-page grid gap-10 py-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Senior care · PWA acessível</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Um cuidado digital calmo, humano e confiável para famílias e cuidadores.
          </h1>
          <p className="text-lg text-text2">
            O IdosoLink organiza contratos, agenda, pagamentos e comunicação em uma experiência PWA clara, pensada para
            quem precisa de acolhimento e simplicidade.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button>Quero conhecer</Button>
            <Button variant="outline">Agendar demonstração</Button>
          </div>
        </div>
        <Card className="bg-surface">
          <CardHeader>
            <CardTitle>Plataforma feita para confiança</CardTitle>
            <CardDescription>Recursos essenciais com linguagem clara e leitura fácil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <IconCare className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">Bem-estar em primeiro lugar</p>
                <p className="text-sm text-text2">Planos de cuidado, histórico e acompanhamento.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconFamily className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">Famílias tranquilas</p>
                <p className="text-sm text-text2">Contratos claros e comunicação organizada.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconCaregiver className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">Cuidadores valorizados</p>
                <p className="text-sm text-text2">Agenda, pagamentos e reputação em um só lugar.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconReputation className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">Reputação transparente</p>
                <p className="text-sm text-text2">Feedbacks gentis e metas de qualidade.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
