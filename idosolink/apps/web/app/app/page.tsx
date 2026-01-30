import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ActivationPrompt } from '../../components/ActivationPrompt';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="glass-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Bem-vindo(a) de volta</h1>
          <Badge label="Modo simples" />
        </div>
        <p className="text-slate-300">
          Sua carteira está pronta, seus contratos estão sincronizados e o histórico de confiança está atualizado.
        </p>
        <ActivationPrompt />
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <Card title="Status da conta">
          <p className="text-slate-300">Ativada com €25 convertidos em 250 tokens.</p>
        </Card>
        <Card title="Contratos ativos">
          <p className="text-2xl font-semibold">2</p>
          <p className="text-slate-300">1 aguardando aceite do cuidador.</p>
        </Card>
        <Card title="Reputação">
          <p className="text-2xl font-semibold">4.8 / 5</p>
          <p className="text-slate-300">Baseado em 28 avaliações verificadas.</p>
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card title="Próximos passos">
          <ul className="space-y-2 text-slate-300">
            <li>✔️ Finalizar contratação com Ana Silva.</li>
            <li>✔️ Agendar visita inicial com cuidador.</li>
            <li>✔️ Enviar gorjeta em token após o primeiro mês.</li>
          </ul>
        </Card>
        <Card title="Insights financeiros">
          <p className="text-slate-300">Taxa de plataforma: 15% já inclusa nos contratos.</p>
          <p className="text-slate-300">Tokens queimados este mês: 1.200.</p>
        </Card>
      </section>
    </div>
  );
}
