import { Card } from '../../components/Card';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Usuários">
            <p className="text-slate-300">1.240 usuários · 620 famílias · 590 cuidadores.</p>
          </Card>
          <Card title="Contratos">
            <p className="text-slate-300">140 ativos · 32 pendentes · 15 cancelados.</p>
          </Card>
          <Card title="Pagamentos">
            <p className="text-slate-300">€34k processados via Stripe este mês.</p>
          </Card>
          <Card title="Flags">
            <p className="text-slate-300">3 contas em revisão por compliance.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
