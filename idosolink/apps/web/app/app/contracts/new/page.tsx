'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input, Label, HelperText } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from '../../../../components/ui/modal';
import { useAppStore } from '../../../store';
import { eurToToken, tokenToEur } from '../../../../lib/finance';

export default function NewContractPage() {
  const router = useRouter();
  const caregivers = useAppStore((state) => state.caregivers);
  const wallet = useAppStore((state) => state.wallet);
  const addTokens = useAppStore((state) => state.addTokens);
  const spendTokens = useAppStore((state) => state.spendTokens);
  const createContract = useAppStore((state) => state.createContract);

  const [caregiverId, setCaregiverId] = useState(caregivers[0]?.id ?? '');
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [tasks, setTasks] = useState('Companhia, higiene leve e apoio em refeições');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('Preferimos horários pela manhã.');
  const [buyAmount, setBuyAmount] = useState(25);

  const caregiver = caregivers.find((item) => item.id === caregiverId);
  const priceEur = useMemo(() => (caregiver ? caregiver.priceHour * hoursPerWeek * 4 : 0), [caregiver, hoursPerWeek]);
  const feeTokens = eurToToken(5);
  const hasBalance = wallet.balanceTokens >= feeTokens;

  const handleCreate = () => {
    if (!caregiver) return;
    if (!hasBalance) return;

    const success = spendTokens(feeTokens, `Taxa de contrato · ${caregiver.name}`);
    if (!success) return;

    const contract = createContract({
      caregiverId: caregiver.id,
      caregiverName: caregiver.name,
      hoursPerWeek,
      tasks: tasks.split(',').map((task) => task.trim()),
      startDate,
      notes,
      priceEur,
      feeTokens
    });

    router.push(`/app/contracts/${contract.id}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova proposta de contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Escolha o cuidador</Label>
            <Select value={caregiverId} onChange={(event) => setCaregiverId(event.target.value)}>
              {caregivers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · €{item.priceHour}/hora
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Horas por semana</Label>
              <Input
                type="number"
                min={4}
                value={hoursPerWeek}
                onChange={(event) => setHoursPerWeek(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Início do cuidado</Label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tarefas principais</Label>
            <Input value={tasks} onChange={(event) => setTasks(event.target.value)} />
            <HelperText>Separe por vírgulas. Ex: companhia, higiene, medicação.</HelperText>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          <div className="rounded-[14px] border border-border/10 bg-bg p-4 text-sm text-text2">
            <p>Estimativa mensal: <strong className="text-text">€{priceEur}</strong></p>
            <p>Taxa de contrato: <strong className="text-text">{feeTokens} créditos</strong> (≈ €{tokenToEur(feeTokens)})</p>
            <p className="mt-2">Essa taxa ajuda a manter a plataforma segura para famílias e cuidadores.</p>
          </div>

          {!hasBalance ? (
            <Modal>
              <ModalTrigger asChild>
                <Button variant="outline">Comprar créditos</Button>
              </ModalTrigger>
              <ModalContent>
                <ModalHeader>
                  <ModalTitle>Comprar créditos</ModalTitle>
                </ModalHeader>
                <div className="space-y-4">
                  <p className="text-sm text-text2">
                    Seu saldo está abaixo do necessário para a taxa de contrato. Escolha um valor para recarregar.
                  </p>
                  <Select value={String(buyAmount)} onChange={(event) => setBuyAmount(Number(event.target.value))}>
                    <option value="5">€5</option>
                    <option value="25">€25</option>
                    <option value="50">€50</option>
                  </Select>
                  <Button
                    onClick={() => {
                      addTokens(buyAmount, 'Compra de créditos', 'purchase');
                    }}
                  >
                    Confirmar compra
                  </Button>
                </div>
              </ModalContent>
            </Modal>
          ) : null}

          <Button onClick={handleCreate} disabled={!caregiver || !hasBalance}>
            Criar proposta
          </Button>
          {!hasBalance ? <p className="text-sm text-warning">Saldo insuficiente para a taxa de contrato.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
