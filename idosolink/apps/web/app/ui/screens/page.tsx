import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { TokenAmount } from '../../../components/ui/token-amount';
import { Stepper } from '../../../components/ui/stepper';
import { ListRow } from '../../../components/ui/list-row';
import { IconCare, IconContract, IconPayment, IconSupport } from '../../../components/icons';

export default function ScreensPage() {
  return (
    <main className="container-page space-y-12 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Screens</h1>
        <p className="text-text2">Fluxos mockados com foco em clareza, calma e confiança para senior care.</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Stepper steps={['Perfil', 'Ativação', 'Dashboard']} currentStep={1} />
            <div className="rounded-[14px] border border-border/10 bg-bg p-4">
              <p className="font-semibold">Escolha do perfil</p>
              <p className="text-sm text-text2">Mostramos só duas opções claras para reduzir ansiedade.</p>
            </div>
            <Button className="w-full">Continuar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ativação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text2">
              Linguagem direta, reforçando segurança e utilidade dos créditos sem jargões técnicos.
            </p>
            <TokenAmount tokens={250} euro={25} />
            <Button className="w-full">Ativar com €25</Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contrato (detalhe)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge status="info">Pending</Badge>
            <ListRow
              icon={<IconContract className="h-5 w-5" />}
              title="Contrato Carmela Oliveira"
              subtitle="20h/sem · início a combinar"
              action={<Button size="sm">Aceitar</Button>}
            />
            <div className="rounded-[14px] border border-border/10 bg-bg p-4 text-sm text-text2">
              Explicamos comissão e prova digital para gerar confiança sem assustar o usuário.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carteira</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TokenAmount tokens={600} euro={60} />
            <ListRow
              icon={<IconPayment className="h-5 w-5" />}
              title="Próximo pagamento"
              subtitle="Agendado para sexta-feira"
              action={<Badge status="success">€280</Badge>}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Modal de gorjeta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text2">Permite reconhecer o cuidador com poucos toques.</p>
            <Button variant="secondary">Enviar gorjeta</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modal de resgate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text2">Fluxo calmo com explicação clara sobre conversão.</p>
            <Button variant="outline">Converter créditos</Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Suporte humano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ListRow
              icon={<IconSupport className="h-5 w-5" />}
              title="Equipe disponível"
              subtitle="Apoio imediato para dúvidas da família."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comunicação clara</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ListRow
              icon={<IconCare className="h-5 w-5" />}
              title="Linguagem acolhedora"
              subtitle="Evita termos técnicos e reforça confiança."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamentos transparentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ListRow
              icon={<IconPayment className="h-5 w-5" />}
              title="Resumo claro"
              subtitle="Sem surpresas e com explicações objetivas."
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
