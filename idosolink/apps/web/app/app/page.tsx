'use client';

import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ListRow } from '../../components/ui/list-row';
import { StatCard } from '../../components/ui/stat-card';
import { useAppStore } from '../store';
import { IconCare, IconCaregiver, IconContract, IconWallet } from '../../components/icons';

export default function DashboardPage() {
  const role = useAppStore((state) => state.role);
  const wallet = useAppStore((state) => state.wallet);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Créditos disponíveis" value={`${wallet.balanceTokens}`} trend={`≈ €${wallet.balanceEurEstimate}`} />
        <StatCard label="Contratos ativos" value="2" trend="+1" />
        <StatCard label="Satisfação geral" value="4.9" trend="+0.1" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{role === 'CUIDADOR' ? 'Propostas em aberto' : 'Buscar cuidadores'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-text2">
              {role === 'CUIDADOR'
                ? 'Acompanhe famílias que aguardam sua resposta e organize sua agenda com cuidado.'
                : 'Encontre profissionais verificados e alinhe expectativas antes de fechar um contrato.'}
            </p>
            <Button asChild>
              <Link href="/app/search">Ir para busca</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meus contratos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-text2">
              Visualize contratos em andamento, pendências e próximos pagamentos de forma clara.
            </p>
            <Button variant="secondary" asChild>
              <Link href="/app/contracts">Ver contratos</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Ações rápidas</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <ListRow
            icon={<IconCare className="h-5 w-5" />}
            title={role === 'CUIDADOR' ? 'Atualizar minha agenda' : 'Criar plano de cuidado'}
            subtitle="Organize tarefas e horários com calma."
            action={
              <Button size="sm" asChild>
                <Link href="/app/contracts/new">Criar</Link>
              </Button>
            }
          />
          <ListRow
            icon={<IconWallet className="h-5 w-5" />}
            title="Carteira de créditos"
            subtitle="Acompanhe saldo e histórico de uso."
            action={
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/wallet">Abrir</Link>
              </Button>
            }
          />
          <ListRow
            icon={<IconContract className="h-5 w-5" />}
            title="Contratos pendentes"
            subtitle="Revise e aceite com transparência."
            action={
              <Button size="sm" variant="ghost" asChild>
                <Link href="/app/contracts">Revisar</Link>
              </Button>
            }
          />
          <ListRow
            icon={<IconCaregiver className="h-5 w-5" />}
            title="Perfil profissional"
            subtitle="Mantenha seu perfil atualizado e confiável."
            action={
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/settings">Editar</Link>
              </Button>
            }
          />
        </div>
      </section>
    </div>
  );
}
