import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { StatCard } from '../../../components/ui/stat-card';
import { ListRow } from '../../../components/ui/list-row';
import { TokenAmount } from '../../../components/ui/token-amount';
import { Stepper } from '../../../components/ui/stepper';
import {
  IconCare,
  IconCaregiver,
  IconContract,
  IconFamily,
  IconPayment,
  IconSchedule,
  IconSupport
} from '../../../components/icons';

export default function ScreensPage() {
  return (
    <main className="container-page space-y-12 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Screens</h1>
        <p className="text-text2">Mockups rápidos para fluxos principais do app.</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard familiar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <IconFamily className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">Ana Silva</p>
                <p className="text-sm text-text2">Plano diário em andamento</p>
              </div>
              <Badge status="success" className="ml-auto">Ativo</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <StatCard label="Horas semana" value="28h" trend="+4%" />
              <StatCard label="Check-ins" value="12" trend="+2" />
              <StatCard label="Satisfação" value="4.8" trend="+0.1" />
            </div>
            <ListRow
              icon={<IconCare className="h-5 w-5" />}
              title="Cuidado principal"
              subtitle="Higiene, mobilidade e alimentação"
              action={<Button size="sm">Detalhar</Button>}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carteira</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TokenAmount tokens={750} euro={75} />
            <ListRow
              icon={<IconPayment className="h-5 w-5" />}
              title="Próximo pagamento"
              subtitle="Agendado para sexta-feira"
              action={<Badge status="info">€280</Badge>}
            />
            <Button className="w-full">Adicionar crédito</Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contratos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ListRow
              icon={<IconContract className="h-5 w-5" />}
              title="Contrato Carmela Oliveira"
              subtitle="Revisão pendente"
              action={<Button variant="outline" size="sm">Revisar</Button>}
            />
            <ListRow
              icon={<IconContract className="h-5 w-5" />}
              title="Contrato Tiago Almeida"
              subtitle="Assinado e ativo"
              action={<Badge status="success">Ok</Badge>}
            />
            <Button variant="secondary" className="w-full">Criar novo contrato</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Stepper steps={['Perfil', 'Preferências', 'Contrato', 'Ativação']} currentStep={3} />
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm font-semibold">Escolha seu cuidador</p>
              <p className="text-sm text-text2">Compare perfis com reputação e agenda.</p>
              <div className="mt-3 flex gap-2">
                <Badge status="info">Disponível</Badge>
                <Badge status="neutral">5 anos de experiência</Badge>
              </div>
            </div>
            <Button className="w-full">Continuar</Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Agenda do cuidador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ListRow
              icon={<IconSchedule className="h-5 w-5" />}
              title="Seg · 08h - 12h"
              subtitle="Higiene e refeições"
            />
            <ListRow
              icon={<IconSchedule className="h-5 w-5" />}
              title="Qua · 14h - 18h"
              subtitle="Atividades cognitivas"
            />
            <Button variant="ghost" className="w-full">Ajustar agenda</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil do cuidador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <IconCaregiver className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Carmela Oliveira</p>
                <p className="text-sm text-text2">Especialista em mobilidade</p>
              </div>
            </div>
            <Badge status="success">Reputação 4.9</Badge>
            <Button variant="outline" className="w-full">Ver perfil</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suporte humano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <IconSupport className="h-6 w-6 text-primary" />
              <p className="text-sm text-text2">Especialistas disponíveis para orientar sua família.</p>
            </div>
            <Button variant="secondary" className="w-full">Falar com suporte</Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
