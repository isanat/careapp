import Link from 'next/link';
import { Card } from '../../../../components/Card';

export default function CaregiverProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <section className="glass-card p-6 space-y-2">
        <h1 className="text-2xl font-semibold">Ana Silva</h1>
        <p className="text-slate-300">Lisboa · Verificada</p>
        <p className="text-white font-semibold">€18/hora</p>
        <div className="flex gap-2 text-xs text-accent">
          <span className="rounded-full border border-accent/40 px-2 py-1">Higiene</span>
          <span className="rounded-full border border-accent/40 px-2 py-1">Medicação</span>
          <span className="rounded-full border border-accent/40 px-2 py-1">Companhia</span>
        </div>
      </section>

      <Card title="Sobre">
        <p className="text-slate-300">
          8 anos de experiência com idosos e certificação em cuidados básicos de saúde. Avaliação média 4.9/5.
        </p>
      </Card>

      <Card title="Disponibilidade">
        <p className="text-slate-300">Seg, Qua e Sex · 08:00 - 16:00</p>
      </Card>

      <Link href="/app/contracts/new" className="rounded-full bg-accent px-6 py-3 text-slate-900 font-semibold">
        Criar contrato
      </Link>
    </div>
  );
}
