'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';
import { useAppStore } from '../../store';

export default function ContractsPage() {
  const contracts = useAppStore((state) => state.contracts);
  const [status, setStatus] = useState('Todos');

  const filtered = useMemo(() => {
    if (status === 'Todos') return contracts;
    return contracts.filter((contract) => contract.status === status);
  }, [contracts, status]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contratos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Todos</option>
              <option>Draft</option>
              <option>Pending</option>
              <option>Active</option>
              <option>Completed</option>
            </Select>
            <Button asChild>
              <Link href="/app/contracts/new">Criar novo</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-text2">Nenhum contrato encontrado para esse filtro.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((contract) => (
            <Card key={contract.id}>
              <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold">{contract.caregiverName}</p>
                  <p className="text-sm text-text2">{contract.hoursPerWeek}h/sem · início {contract.startDate || 'a combinar'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={contract.status === 'Active' ? 'success' : contract.status === 'Pending' ? 'info' : 'neutral'}>
                    {contract.status}
                  </Badge>
                  <Button size="sm" asChild>
                    <Link href={`/app/contracts/${contract.id}`}>Ver detalhes</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
