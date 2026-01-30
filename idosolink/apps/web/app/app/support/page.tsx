import { Card } from '../../../components/Card';

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">Suporte</h1>
      <Card title="FAQ">
        <ul className="space-y-2 text-slate-300">
          <li>Como funcionam os tokens? Eles são usados para taxas e bônus.</li>
          <li>Posso cancelar um contrato? Sim, com regras claras definidas no contrato.</li>
          <li>Como funciona a blockchain? O registro é automático e invisível.</li>
        </ul>
      </Card>
      <Card title="Abrir ticket">
        <p className="text-slate-300">Envie sua dúvida para nosso time de atendimento.</p>
        <button className="mt-3 rounded-full bg-accent px-5 py-2 text-slate-900 font-semibold">Enviar ticket</button>
      </Card>
    </div>
  );
}
