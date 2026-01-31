import { Card } from '../../../components/Card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">Configurações</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Perfil">
          <p className="text-slate-300">Atualize seus dados, especialidades e verificação.</p>
          <button className="mt-3 text-accent">Editar perfil</button>
        </Card>
        <Card title="Carteira">
          <p className="text-slate-300">Modo simples / avançado e endereço on-chain.</p>
          <button className="mt-3 text-accent">Alternar modo</button>
        </Card>
        <Card title="Notificações">
          <p className="text-slate-300">Alertas de contrato, pagamentos e bônus.</p>
          <button className="mt-3 text-accent">Gerenciar</button>
        </Card>
        <Card title="Segurança">
          <p className="text-slate-300">OTP, permissões e exportação de carteira.</p>
          <button className="mt-3 text-accent">Ver opções</button>
        </Card>
      </div>
    </div>
  );
}
