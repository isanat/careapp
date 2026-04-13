import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { IconCare, IconCaregiver, IconFamily, IconReputation } from '../components/icons';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg pb-14">
      <header className="container-page py-8">
        <div className="bloom-shell flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.svg" alt="IdosoLink" className="h-11 w-11 rounded-xl" />
            <div>
              <p className="text-2xl font-semibold text-primary">IdosoLink</p>
              <p className="text-sm text-text2">Care-focused platform</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild>
              <Link href="/ui">UI Kit</Link>
            </Button>
            <Button asChild>
              <Link href="/onboarding">Começar</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container-page grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="bloom-shell space-y-6 px-6 py-8">
          <span className="bloom-chip">Bloom Elements visual system</span>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Cuidar com confiança. Organizar com clareza.
          </h1>
          <p className="max-w-2xl text-text2">
            Um sistema premium de senior care com experiência acolhedora para famílias e cuidadores: contratos,
            agenda, suporte e carteira de créditos em um único lugar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/onboarding">Criar conta</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/app">Ver aplicação</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {[IconCare, IconFamily, IconCaregiver, IconReputation].map((Icon, index) => (
            <Card key={index}>
              <CardContent className="flex items-center gap-3">
                <div className="rounded-2xl bg-accent/55 p-3 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">{['Bem-estar', 'Família', 'Cuidador', 'Reputação'][index]}</CardTitle>
                  <CardDescription>
                    {
                      [
                        'Interface calma com leitura confortável.',
                        'Transparência de contratos e rotinas.',
                        'Agenda e propostas com linguagem clara.',
                        'Indicadores de qualidade e confiança.'
                      ][index]
                    }
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
