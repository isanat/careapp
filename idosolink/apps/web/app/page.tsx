import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.svg" alt="IdosoLink" className="h-10" />
          <span className="text-xl font-semibold">IdosoLink</span>
        </div>
        <Link
          href="/auth/login"
          className="rounded-full bg-accent px-6 py-2 text-slate-900 font-semibold"
        >
          Entrar
        </Link>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-2 items-center">
        <div className="space-y-6">
          <p className="uppercase tracking-[0.3em] text-xs text-accent">Marketplace + blockchain invisível</p>
          <h1 className="text-4xl md:text-5xl font-semibold">
            Uma experiência web "app-like" para cuidados de idosos com contratos digitais e token utilitário.
          </h1>
          <p className="text-slate-300">
            IdosoLink conecta famílias e cuidadores com confiança auditável, pagamentos seguros em euro via Stripe e uma
            carteira embutida que transforma taxas em tokens — tudo sem complexidade de blockchain.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/auth/login" className="rounded-full bg-accent px-6 py-3 text-slate-900 font-semibold">
              Entrar na plataforma
            </Link>
            <Link href="/onboarding" className="rounded-full border border-accent/50 px-6 py-3 text-accent">
              Criar conta
            </Link>
          </div>
          <div className="grid gap-3">
            <div className="glass-card p-4">Confiança, histórico e reputação em cada contrato.</div>
            <div className="glass-card p-4">Modelo econômico sustentável com queima de tokens.</div>
            <div className="glass-card p-4">Experiência premium pronta para investidores.</div>
          </div>
        </div>
        <div className="glass-card p-8 text-center space-y-6">
          <img src="/assets/token.svg" alt="Token IdosoLink" className="mx-auto w-60" />
          <p className="text-slate-300">
            O token IdosoLink ativa contas, viabiliza contratos e recompensa cuidadores com bônus e gorjetas.
          </p>
        </div>
      </section>
    </main>
  );
}
