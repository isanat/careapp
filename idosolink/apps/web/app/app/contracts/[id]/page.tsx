'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from '../../../../components/ui/modal';
import { useAppStore } from '../../../store';
import { canonicalJson, sha256 } from '../../../../lib/crypto';

export default function ContractDetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const role = useAppStore((state) => state.role);
  const contracts = useAppStore((state) => state.contracts);
  const updateContract = useAppStore((state) => state.updateContract);
  const contract = contracts.find((item) => item.id === params.id);

  const commission = useMemo(() => (contract ? Number((contract.priceEur * 0.15).toFixed(2)) : 0), [contract]);

  if (!contract) {
    return (
      <Card>
        <CardContent>
          <p className="text-text2">Contrato não encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  const alreadyAccepted =
    (role === 'FAMILIAR' && contract.acceptedByFamily) ||
    (role === 'CUIDADOR' && contract.acceptedByCaregiver);

  const handleAccept = async () => {
    setLoading(true);
    const updates = {
      acceptedByFamily: contract.acceptedByFamily || role === 'FAMILIAR',
      acceptedByCaregiver: contract.acceptedByCaregiver || role === 'CUIDADOR'
    };

    let proofHash = contract.proofHash;
    let txHash = contract.txHash;

    if (updates.acceptedByFamily && updates.acceptedByCaregiver) {
      const payload = canonicalJson({
        id: contract.id,
        caregiverId: contract.caregiverId,
        hoursPerWeek: contract.hoursPerWeek,
        tasks: contract.tasks,
        startDate: contract.startDate,
        priceEur: contract.priceEur,
        feeTokens: contract.feeTokens
      });
      proofHash = await sha256(payload);
      txHash = `tx_${proofHash.slice(0, 10)}`;
    }

    updateContract(contract.id, {
      ...updates,
      status: updates.acceptedByFamily && updates.acceptedByCaregiver ? 'Active' : contract.status,
      proofHash,
      txHash
    });
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contrato com {contract.caregiverName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge status="info">{contract.status}</Badge>
            <Badge status="neutral">{contract.hoursPerWeek}h/sem</Badge>
            <Badge status="neutral">€{contract.priceEur} / mês</Badge>
          </div>
          <p className="text-sm text-text2">Tarefas: {contract.tasks.join(', ')}</p>
          <p className="text-sm text-text2">Início previsto: {contract.startDate || 'a combinar'}</p>
          <p className="text-sm text-text2">Observações: {contract.notes}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transparência financeira</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text2">
          <p>Taxa de contrato: {contract.feeTokens} créditos (cobrada uma vez).</p>
          <p>Comissão da plataforma: 15% do valor total (≈ €{commission}).</p>
          <p>Pagamentos são agendados com clareza antes de cada semana de cuidado.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status do aceite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-text2">
          <p>Familiar: {contract.acceptedByFamily ? 'Aceito' : 'Aguardando aceite'}</p>
          <p>Cuidador: {contract.acceptedByCaregiver ? 'Aceito' : 'Aguardando aceite'}</p>
          {contract.proofHash ? (
            <div className="rounded-[14px] border border-border/10 bg-bg p-3">
              <p className="font-semibold text-text">Registrado com prova digital</p>
              <p className="break-all">Hash: {contract.proofHash}</p>
              <p className="break-all">Tx: {contract.txHash}</p>
            </div>
          ) : null}
          <Modal>
            <ModalTrigger asChild>
              <Button variant="secondary" disabled={loading || alreadyAccepted}>
                {alreadyAccepted ? 'Contrato já aceito' : loading ? 'Processando...' : 'Aceitar contrato'}
              </Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Confirmar aceite</ModalTitle>
                <ModalDescription>
                  Ao aceitar, registramos uma prova digital do contrato para segurança de ambas as partes.
                </ModalDescription>
              </ModalHeader>
              <Button onClick={handleAccept} disabled={loading}>
                Confirmar aceite
              </Button>
            </ModalContent>
          </Modal>
        </CardContent>
      </Card>
    </div>
  );
}
