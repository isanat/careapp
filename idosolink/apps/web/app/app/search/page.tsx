import Link from 'next/link';
import { Card } from '../../../components/Card';

const caregivers = [
  { id: '1', name: 'Ana Silva', city: 'Lisboa', rate: 18, skills: ['Higiene', 'Medicação', 'Companhia'] },
  { id: '2', name: 'Carlos Moreira', city: 'Porto', rate: 16, skills: ['Mobilidade', 'Companhia'] },
  { id: '3', name: 'Luisa Costa', city: 'Lisboa', rate: 22, skills: ['Cuidados noturnos', 'Alimentação'] }
];

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="section-title">Buscar cuidadores</h1>
        <p className="subtle-text">Compare reputação, preço/hora e disponibilidade para criar um contrato seguro.</p>
      </section>
      <div className="grid md:grid-cols-2 gap-4">
        {caregivers.map((caregiver) => (
          <Card key={caregiver.id} title={caregiver.name}>
            <p className="text-slate-300">{caregiver.city}</p>
            <p className="text-white font-semibold">€{caregiver.rate}/hora</p>
            <div className="flex flex-wrap gap-2 text-xs text-accent">
              {caregiver.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-accent/40 px-2 py-1">{skill}</span>
              ))}
            </div>
            <Link href={`/app/caregiver/${caregiver.id}`} className="text-accent">
              Ver perfil
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
