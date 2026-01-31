'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input, Label, HelperText } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { useAppStore } from '../../store';

export default function SettingsPage() {
  const role = useAppStore((state) => state.role);
  const settings = useAppStore((state) => state.settings);
  const toggleAdvancedMode = useAppStore((state) => state.toggleAdvancedMode);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [serviceFocus, setServiceFocus] = useState('Companhia e mobilidade');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input placeholder="+351 ..." />
          </div>
          <div className="space-y-2">
            <Label>Preferências de contato</Label>
            <Select>
              <option>WhatsApp</option>
              <option>Telefone</option>
              <option>Email</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modo de uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-text2">
            O modo simples mostra apenas informações essenciais. O modo avançado exibe endereço e hashes de transações.
          </p>
          <Button variant="secondary" onClick={toggleAdvancedMode}>
            {settings.advancedMode ? 'Voltar para modo simples' : 'Ativar modo avançado'}
          </Button>
        </CardContent>
      </Card>

      {role === 'CUIDADOR' ? (
        <Card>
          <CardHeader>
            <CardTitle>Serviços e preço/hora</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Preço/hora</Label>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(event) => setHourlyRate(Number(event.target.value))}
              />
              <HelperText>Valores justos ajudam na confiança.</HelperText>
            </div>
            <div className="space-y-2">
              <Label>Serviços principais</Label>
              <Input value={serviceFocus} onChange={(event) => setServiceFocus(event.target.value)} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
