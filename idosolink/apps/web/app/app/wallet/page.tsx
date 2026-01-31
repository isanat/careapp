'use client';

import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from '../../../components/ui/modal';
import { Select } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { TokenAmount } from '../../../components/ui/token-amount';
import { useAppStore } from '../../store';
import { eurToToken } from '../../../lib/finance';

export default function WalletPage() {
  const role = useAppStore((state) => state.role);
  const wallet = useAppStore((state) => state.wallet);
  const ledger = useAppStore((state) => state.ledger);
  const settings = useAppStore((state) => state.settings);
  const addTokens = useAppStore((state) => state.addTokens);
  const addTip = useAppStore((state) => state.addTip);
  const redeemTokens = useAppStore((state) => state.redeemTokens);
  const contracts = useAppStore((state) => state.contracts);

  const [purchaseAmount, setPurchaseAmount] = useState(25);
  const [tipContractId, setTipContractId] = useState(contracts[0]?.id ?? '');
  const [tipValue, setTipValue] = useState(20);
  const [redeemValue, setRedeemValue] = useState(100);
  const canTip = wallet.balanceTokens >= tipValue;
  const canRedeem = wallet.balanceTokens >= redeemValue;

  const contractOptions = useMemo(() => contracts.map((item) => ({ id: item.id, name: item.caregiverName })), [contracts]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Minha carteira de créditos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TokenAmount tokens={wallet.balanceTokens} euro={wallet.balanceEurEstimate} />
          <p className="text-sm text-text2">
            {settings.advancedMode
              ? `Carteira avançada ativa · Endereço ${wallet.address} · créditos (tokens)`
              : 'Modo simples ativo. Você pode alternar para modo avançado em Ajustes.'}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Modal>
          <ModalTrigger asChild>
            <Button variant="outline">Comprar créditos</Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Comprar créditos</ModalTitle>
            </ModalHeader>
            <div className="space-y-4">
              <Select value={String(purchaseAmount)} onChange={(event) => setPurchaseAmount(Number(event.target.value))}>
                <option value="5">€5</option>
                <option value="25">€25</option>
                <option value="50">€50</option>
              </Select>
              <Button
                onClick={() => addTokens(purchaseAmount, 'Compra de créditos', 'purchase')}
              >
                Comprar {eurToToken(purchaseAmount)} créditos
              </Button>
            </div>
          </ModalContent>
        </Modal>

        <Modal>
          <ModalTrigger asChild>
            <Button variant="secondary">Enviar gorjeta</Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Enviar gorjeta</ModalTitle>
            </ModalHeader>
            <div className="space-y-4">
              <Select value={tipContractId} onChange={(event) => setTipContractId(event.target.value)}>
                {contractOptions.length === 0 ? (
                  <option value=\"\">Nenhum contrato disponível</option>
                ) : (
                  contractOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))
                )}
              </Select>
              <Select value={String(tipValue)} onChange={(event) => setTipValue(Number(event.target.value))}>
                <option value="10">10 créditos</option>
                <option value="20">20 créditos</option>
                <option value="50">50 créditos</option>
              </Select>
              <Button onClick={() => addTip(tipContractId, tipValue)} disabled={!canTip || !tipContractId}>
                Enviar gorjeta
              </Button>
              {!tipContractId ? (
                <p className=\"text-sm text-warning\">Crie um contrato para enviar gorjetas.</p>
              ) : !canTip ? (
                <p className=\"text-sm text-warning\">Saldo insuficiente para enviar gorjeta.</p>
              ) : null}
            </div>
          </ModalContent>
        </Modal>

        {role === 'CUIDADOR' ? (
          <Modal>
            <ModalTrigger asChild>
              <Button variant="ghost">Converter para €</Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Converter créditos em euro</ModalTitle>
              </ModalHeader>
              <div className="space-y-4">
                <Select value={String(redeemValue)} onChange={(event) => setRedeemValue(Number(event.target.value))}>
                  <option value="100">100 créditos</option>
                  <option value="250">250 créditos</option>
                  <option value="500">500 créditos</option>
                </Select>
                <Button onClick={() => redeemTokens(redeemValue)} disabled={!canRedeem}>
                  Solicitar conversão
                </Button>
                {!canRedeem ? <p className=\"text-sm text-warning\">Saldo insuficiente para converter.</p> : null}
              </div>
            </ModalContent>
          </Modal>
        ) : (
          <Button variant="ghost" disabled>
            Conversão disponível para cuidadores
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ledger.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between text-sm text-text2">
              <div>
                <p className="font-semibold text-text">{entry.description}</p>
                <p>{new Date(entry.date).toLocaleDateString('pt-PT')}</p>
                {settings.advancedMode && entry.txHash ? (
                  <p className="break-all text-xs">{entry.txHash}</p>
                ) : null}
              </div>
              <Badge status={entry.tokens > 0 ? 'success' : 'neutral'}>
                {entry.tokens > 0 ? '+' : ''}{entry.tokens} créditos
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
