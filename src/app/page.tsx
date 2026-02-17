"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/layout/public-layout";
import { 
  IconToken, 
  IconCare, 
  IconTrust,
  IconWallet,
  IconChevronRight,
  IconArrowUp,
  IconEuro,
  IconCoins,
  IconShield,
  IconStar
} from "@/components/icons";
import { APP_NAME, TOKEN_NAME, TOKEN_SYMBOL } from "@/lib/constants";

export default function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 py-16 md:py-24 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                🇪🇺 Senior Care · PWA Acessível
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Cuidado com{" "}
                <span className="text-primary">confiança</span>,{" "}
                <span className="text-primary">valor</span> e{" "}
                <span className="text-primary">transparência</span>.
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">
                O primeiro ecossistema global de cuidados para idosos que une família, cuidador e tecnologia, 
                usando blockchain de forma invisível para gerar confiança e valorização profissional.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth/register">
                    Sou Familiar
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/register?role=caregiver">
                    Sou Cuidador
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t mt-8">
                <div>
                  <p className="text-3xl font-bold text-primary">2.500+</p>
                  <p className="text-sm text-muted-foreground">Cuidadores Verificados</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">15.000+</p>
                  <p className="text-sm text-muted-foreground">Famílias Atendidas</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">4.9★</p>
                  <p className="text-sm text-muted-foreground">Avaliação Média</p>
                </div>
              </div>
            </div>

            {/* Right Content - Feature Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-primary/20 rounded-full">
                    <IconToken className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{TOKEN_NAME} ({TOKEN_SYMBOL})</CardTitle>
                    <CardDescription>Token que valoriza quem cuida</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <IconArrowUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Valorização Natural</p>
                    <p className="text-sm text-muted-foreground">Quanto mais contratos, mais valoriza</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <IconShield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Backed em Euro</p>
                    <p className="text-sm text-muted-foreground">Cada token tem €1 de reserva</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <IconCoins className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Mecanismo Deflacionário</p>
                    <p className="text-sm text-muted-foreground">Tokens queimados em cada resgate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Funciona</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simples, transparente e seguro para todos. Veja como conectamos famílias e cuidadores.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cadastro & Ativação</h3>
              <p className="text-muted-foreground">
                Crie sua conta como família ou cuidador. Pague a ativação de €35 e receba seus primeiros tokens automaticamente.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Match & Contrato</h3>
              <p className="text-muted-foreground">
                Encontre o cuidador ideal ou receba propostas. Crie contratos registrados na blockchain com taxa de €5.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cuidado & Valor</h3>
              <p className="text-muted-foreground">
                Pague serviços com segurança, envie gorjetas em tokens. Cuidadores acumulam valor a longo prazo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Families Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline">Para Famílias</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Encontre cuidadores de confiança para seus entes queridos
              </h2>
              <p className="text-muted-foreground">
                A plataforma que oferece transparência, segurança e qualidade no cuidado de idosos. 
                Cada contrato é registrado na blockchain, garantindo imutabilidade e confiança.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <IconTrust className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Cuidadores Verificados</p>
                    <p className="text-sm text-muted-foreground">Verificação de identidade, antecedentes e qualificações</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconShield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Contratos Imutáveis</p>
                    <p className="text-sm text-muted-foreground">Registrados na blockchain para máxima segurança jurídica</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconStar className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Sistema de Reputação</p>
                    <p className="text-sm text-muted-foreground">Avaliações reais de famílias atendidas</p>
                  </div>
                </div>
              </div>

              <Button size="lg" asChild>
                <Link href="/auth/register">
                  Começar Agora
                  <IconChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Benefícios para Famílias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>Busca de cuidadores</span>
                  <Badge variant="secondary">Grátis</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>Ativação da conta</span>
                  <Badge>€35 (em tokens)</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>Taxa por contrato</span>
                  <Badge>€5 (em tokens)</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>Comissão da plataforma</span>
                  <Badge>10%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>Gorjetas em tokens</span>
                  <Badge variant="secondary">Opcional</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Caregivers Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Card className="order-2 lg:order-1">
              <CardHeader>
                <CardTitle>Benefícios para Cuidadores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>Perfil profissional</span>
                  <Badge variant="secondary">Grátis</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>Ativação da conta</span>
                  <Badge>€35 (em tokens)</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>Taxa por contrato</span>
                  <Badge>€5 (em tokens)</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>Recebimento de serviços</span>
                  <Badge>90% do valor</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span>Gorjetas em tokens</span>
                  <Badge className="bg-primary">Valorizam!</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 order-1 lg:order-2">
              <Badge variant="outline">Para Cuidadores</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Construa sua carreira e ganhe mais com valorização
              </h2>
              <p className="text-muted-foreground">
                Mais do que apenas trabalhar, construa sua reputação profissional e acumule tokens 
                que valorizam com o crescimento da plataforma. Seu trabalho tem valor de longo prazo.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <IconWallet className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Carteira Automática</p>
                    <p className="text-sm text-muted-foreground">Criada no cadastro, sem complicação com chaves privadas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconCoins className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Tokens que Valorizam</p>
                    <p className="text-sm text-muted-foreground">Quanto mais a plataforma cresce, mais seu tokens valem</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconEuro className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Venda quando quiser</p>
                    <p className="text-sm text-muted-foreground">Converta tokens em euro a qualquer momento</p>
                  </div>
                </div>
              </div>

              <Button size="lg" asChild>
                <Link href="/auth/register?role=caregiver">
                  Cadastrar como Cuidador
                  <IconChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Token Economics Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <IconToken className="h-4 w-4 mr-2" />
              Tokenomics
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {TOKEN_NAME} ({TOKEN_SYMBOL})
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Um token utilitário com economia real, backing em euro e mecanismo deflacionário. 
              Não é especulação, é valorização baseada em uso real.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconEuro className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-bold mb-1">€1</p>
                <p className="text-sm text-muted-foreground">Valor Inicial por Token</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconArrowUp className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-3xl font-bold mb-1">100%</p>
                <p className="text-sm text-muted-foreground">Backed em Euro</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconShield className="h-6 w-6 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold mb-1">Polygon</p>
                <p className="text-sm text-muted-foreground">Blockchain Segura</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconCoins className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-3xl font-bold mb-1">Queima</p>
                <p className="text-sm text-muted-foreground">Em cada resgate</p>
              </CardContent>
            </Card>
          </div>

          {/* Token Flow Diagram */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="text-center">Fluxo Econômico do Token</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <p className="font-semibold text-green-600 mb-2">Entrada</p>
                  <p className="text-sm text-muted-foreground">
                    € via Stripe → Tokens emitidos → Carteira do usuário
                  </p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="font-semibold text-primary mb-2">Uso</p>
                  <p className="text-sm text-muted-foreground">
                    Taxas de contrato, gorjetas, pagamentos de serviços
                  </p>
                </div>
                <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                  <p className="font-semibold text-red-600 mb-2">Saída</p>
                  <p className="text-sm text-muted-foreground">
                    Tokens vendidos por € → Tokens queimados → Oferta diminui
                  </p>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Mais uso = mais queima = menos oferta = valor tende a subir ↑
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Junte-se a milhares de famílias e cuidadores que já estão construindo relações de confiança e valor.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                Sou Familiar
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/auth/register?role=caregiver">
                Sou Cuidador
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
// trigger build
