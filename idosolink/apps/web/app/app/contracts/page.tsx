import Link from 'next/link';
import { Card } from '../../../components/Card';

const contracts = [
  { id: 'c1', caregiver: 'Ana Silva', status: 'Pendente', hours: '20h/sem' },
  { id: 'c2', caregiver: 'Luisa Costa', status: 'Ativo', hours: '12h/sem' }
];

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Contratos</h1>
          <p className="subtle-text">Gerencie propostas, aceite e histórico.</p>
        </div>
        <Link href="/app/contracts/new" className="text-accent">Novo contrato</Link>
      </div>
      <div className="grid gap-4">
        {contracts.map((contract) => (
          <Card key={contract.id} title={`Cuidador: ${contract.caregiver}`}>
            <p className="text-slate-300">Status: {contract.status}</p>
            <p className="text-slate-300">Carga: {contract.hours}</p>
            <Link href={`/app/contracts/${contract.id}`} className="text-accent">
              Ver detalhes
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
