'use client';

import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { Input, Label, HelperText, ErrorText } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Alert } from '../../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalTrigger
} from '../../../components/ui/modal';
import { Drawer, DrawerContent, DrawerHandle, DrawerTrigger } from '../../../components/ui/drawer';
import { BottomNav } from '../../../components/ui/bottom-nav';
import { StatCard } from '../../../components/ui/stat-card';
import { ListRow } from '../../../components/ui/list-row';
import { TokenAmount } from '../../../components/ui/token-amount';
import { Stepper } from '../../../components/ui/stepper';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  IconCare,
  IconContract,
  IconPayment,
  IconSupport,
  IconWallet
} from '../../../components/icons';

export default function ComponentsPage() {
  return (
    <main className="container-page space-y-10 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Componentes</h1>
        <p className="text-text2">Biblioteca reutilizável do IdosoLink UI Kit.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Card</h2>
        <Card>
          <CardHeader>
            <CardTitle>Convite para cuidadores</CardTitle>
            <CardDescription>Enviar convite para profissionais verificados.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text2">
              Crie uma rede de cuidadores confiáveis com perfil, agenda e contratos claros.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Enviar convite</Button>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inputs + Select</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="Digite o nome do familiar" />
            <HelperText>Essa informação aparece nos contratos.</HelperText>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shift">Turno preferido</Label>
            <Select id="shift">
              <option>Manhã</option>
              <option>Tarde</option>
              <option>Noite</option>
            </Select>
            <ErrorText>Escolha um turno válido.</ErrorText>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Badges & Alerts</h2>
        <div className="flex flex-wrap gap-2">
          <Badge status="success">Ativo</Badge>
          <Badge status="info">Novo</Badge>
          <Badge status="warning">Atenção</Badge>
          <Badge status="danger">Atraso</Badge>
          <Badge status="neutral">Rascunho</Badge>
        </div>
        <Alert icon={<IconCare className="h-5 w-5" />}>
          Seu plano de cuidado está atualizado e pronto para compartilhar com a família.
        </Alert>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tabs</h2>
        <Tabs defaultValue="agenda">
          <TabsList>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
            <TabsTrigger value="suporte">Suporte</TabsTrigger>
          </TabsList>
          <TabsContent value="agenda">
            <p className="text-sm text-text2">Organize os horários semanais e os cuidados prioritários.</p>
          </TabsContent>
          <TabsContent value="contratos">
            <p className="text-sm text-text2">Revise contratos assinados e pendências em um só lugar.</p>
          </TabsContent>
          <TabsContent value="suporte">
            <p className="text-sm text-text2">Acesse o canal de apoio com especialistas em cuidado.</p>
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Modal & Drawer</h2>
        <div className="flex flex-wrap gap-3">
          <Modal>
            <ModalTrigger asChild>
              <Button variant="outline">Abrir modal</Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Novo acompanhamento</ModalTitle>
                <ModalDescription>Registre observações com calma e detalhes.</ModalDescription>
              </ModalHeader>
              <div className="mt-4 space-y-3">
                <Input placeholder="Observação rápida" />
                <Button>Salvar</Button>
              </div>
            </ModalContent>
          </Modal>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">Abrir drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHandle />
              <div className="space-y-2">
                <p className="text-lg font-semibold">Resumo da semana</p>
                <p className="text-sm text-text2">Acompanhe atividades e registros.</p>
                <Button className="w-full">Ver agenda</Button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Bottom navigation</h2>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-text2">Pré-visualização mobile (fixa ao final da tela).</p>
          <BottomNav className="static mt-4" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Stat cards</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Horas acompanhadas" value="32h" trend="+6%" />
          <StatCard label="Satisfação" value="4.9" trend="+0.2" />
          <StatCard label="Planos ativos" value="12" trend="+1" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">List rows</h2>
        <div className="grid gap-3">
          <ListRow
            icon={<IconContract className="h-5 w-5" />}
            title="Contrato com Ana Silva"
            subtitle="Revisar antes de enviar"
            action={<Button size="sm">Abrir</Button>}
          />
          <ListRow
            icon={<IconPayment className="h-5 w-5" />}
            title="Pagamento semanal"
            subtitle="Próximo repasse em 2 dias"
            action={<Button variant="outline" size="sm">Detalhar</Button>}
          />
          <ListRow
            icon={<IconSupport className="h-5 w-5" />}
            title="Chat com suporte"
            subtitle="Disponível 24h para famílias"
            action={<Button variant="ghost" size="sm">Conversar</Button>}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Créditos</h2>
        <TokenAmount tokens={420} euro={42} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Stepper</h2>
        <Stepper steps={['Perfil', 'Contrato', 'Pagamento', 'Confirmação']} currentStep={2} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Linha de carteira</h2>
        <ListRow
          icon={<IconWallet className="h-5 w-5" />}
          title="Carteira familiar"
          subtitle="Saldo atualizado hoje"
          action={<Badge status="success">Em dia</Badge>}
        />
      </section>
    </main>
  );
}
