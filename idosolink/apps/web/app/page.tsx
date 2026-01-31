import Link from 'next/link';
import { Card } from '../components/Card';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.svg" alt="IdosoLink" className="h-10" />
          <span className="text-xl font-semibold">IdosoLink</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="rounded-full border border-accent/50 px-5 py-2 text-accent">
            Entrar
          </Link>
          <Link href="/app" className="rounded-full bg-accent px-5 py-2 text-slate-900 font-semibold">
            Abrir app
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-10 lg:grid-cols-2 items-center">
        <div className="space-y-6">
          <p className="uppercase tracking-[0.3em] text-xs text-accent">PWA completo · Contratos digitais</p>
          <h1 className="text-4xl md:text-5xl font-semibold">
            A experiência definitiva de cuidados para idosos, agora 100% web e instalável.
          </h1>
          <p className="text-slate-300">
            Substitua o app nativo por uma PWA premium com navegação por abas, carteira embutida, contratos digitais e
            pagamentos em euro com conversão automática para tokens.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/onboarding" className="rounded-full bg-accent px-6 py-3 text-slate-900 font-semibold">
              Criar conta
            </Link>
            <Link href="/app" className="rounded-full border border-accent/50 px-6 py-3 text-accent">
              Ver dashboard
            </Link>
          </div>
          <div className="grid gap-3">
            <div className="glass-card p-4">Fluxo de ativação €25 → tokens imediatos na carteira.</div>
            <div className="glass-card p-4">Taxa de contrato €5 por parte + registro on-chain.</div>
            <div className="glass-card p-4">Gorjetas e resgate com queima automática.</div>
          </div>
        </div>
        <div className="glass-card p-8 space-y-6">
          <img src="/assets/token.svg" alt="Token IdosoLink" className="mx-auto w-60" />
          <p className="text-slate-300 text-center">
            O token IdosoLink move o ecossistema com transparência, reputação e incentivos de longo prazo.
          </p>
          <div className="grid gap-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Saldo demo</span>
              <strong className="text-white">420 tokens</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Equivalente</span>
              <strong className="text-white">€42</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid gap-6 md:grid-cols-3">
        <Card title="Para Famílias">
          <p className="text-slate-300">
            Busque cuidadores verificados, acompanhe contratos e tenha histórico auditável em um só lugar.
          </p>
        </Card>
        <Card title="Para Cuidadores">
          <p className="text-slate-300">
            Controle sua agenda, defina preço/hora, receba bônus em tokens e evolua sua reputação.
          </p>
        </Card>
        <Card title="Para Investidores">
          <p className="text-slate-300">
            Receita recorrente, taxas transacionais e tokenomics deflacionária conectada ao uso real.
          </p>
        </Card>
      </section>
    </main>
  );
}
