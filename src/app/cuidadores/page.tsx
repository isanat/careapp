"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconCaregiver, 
  IconWallet, 
  IconCoins, 
  IconEuro,
  IconStar,
  IconShield,
  IconChevronRight,
  IconCheck
} from "@/components/icons";
import { APP_NAME, TOKEN_SYMBOL } from "@/lib/constants";

export default function CuidadoresPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <Badge className="bg-primary text-primary-foreground mb-4">
                      Ganhe mais com {APP_NAME}
                    </Badge>
                    <h3 className="text-2xl font-bold">Benefícios Exclusivos</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <IconEuro className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">85% do valor</p>
                        <p className="text-sm text-muted-foreground">Direto para você</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <IconCoins className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Tokens que Valorizam</p>
                        <p className="text-sm text-muted-foreground">Gorjetas em {TOKEN_SYMBOL}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <IconWallet className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Carteira Automática</p>
                        <p className="text-sm text-muted-foreground">Sem complicação</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="order-1 lg:order-2">
              <Badge variant="secondary" className="mb-4">
                Para Cuidadores
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Construa sua carreira e ganhe mais com valorização
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Mais do que apenas trabalhar, construa sua reputação profissional e acumule 
                tokens que valorizam com o crescimento da plataforma. Seu trabalho tem valor de longo prazo.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth/register?role=caregiver">
                    Cadastrar como Cuidador
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/como-funciona">
                    Como Funciona
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que ser cuidador no {APP_NAME}?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Valorizamos seu trabalho e construímos ferramentas para sua carreira crescer.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                  <IconWallet className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Carteira Automática</h3>
                <p className="text-muted-foreground">
                  Criada automaticamente no cadastro. Sem chaves privadas para gerenciar. 
                  Simples e seguro.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
                  <IconCoins className="h-7 w-7 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Tokens que Valorizam</h3>
                <p className="text-muted-foreground">
                  Receba gorjetas em {TOKEN_SYMBOL}. Quanto mais a plataforma cresce, 
                  mais seus tokens valem.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <IconEuro className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Venda Quando Quiser</h3>
                <p className="text-muted-foreground">
                  Converta seus tokens em euro a qualquer momento. Liquidez garantida 
                  com backing de €1 por token.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Quanto você pode ganhar?</h2>
              <p className="text-muted-foreground mb-8">
                Com o {APP_NAME}, você recebe 85% de cada serviço prestado, 
                mais gorjetas em tokens que valorizam.
              </p>
              
              <Card>
                <CardHeader>
                  <CardTitle>Taxas para Cuidadores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Perfil profissional</span>
                    <Badge variant="secondary">Grátis</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Ativação da conta</span>
                    <Badge>€25 (em tokens)</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Taxa por contrato</span>
                    <Badge>€5 (em tokens)</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span>Recebimento de serviços</span>
                    <Badge className="bg-green-600">85% do valor</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <span>Gorjetas em tokens</span>
                    <Badge className="bg-yellow-600">Valorizam!</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-center">Exemplo de Ganhos Mensais</h3>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-background/50 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">Trabalhando 20 horas/semana</p>
                    <p className="text-4xl font-bold text-primary">€1.020</p>
                    <p className="text-sm text-muted-foreground">por mês (85% de €1.200)</p>
                  </div>
                  <div className="text-center p-6 bg-background/50 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">+ Gorjetas médias</p>
                    <p className="text-4xl font-bold text-yellow-600">+€150</p>
                    <p className="text-sm text-muted-foreground">em {TOKEN_SYMBOL} tokens</p>
                  </div>
                  <div className="border-t pt-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Total estimado</p>
                    <p className="text-5xl font-bold text-green-600">€1.170</p>
                    <p className="text-sm text-muted-foreground">por mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que você precisa para crescer</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <IconStar className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Reputação Sólida</h3>
                <p className="text-sm text-muted-foreground">
                  Avaliações verificadas que constroem sua credibilidade
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <IconShield className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Contratos Protegidos</h3>
                <p className="text-sm text-muted-foreground">
                  Registro blockchain garante seus direitos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <IconWallet className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Pagamentos Rápidos</h3>
                <p className="text-sm text-muted-foreground">
                  Receba diretamente na sua carteira digital
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <IconCoins className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Valorização</h3>
                <p className="text-sm text-muted-foreground">
                  Tokens que crescem com a plataforma
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Comece sua jornada hoje</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            Junte-se a milhares de cuidadores que já estão construindo suas carreiras no {APP_NAME}.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/register?role=caregiver">
              Criar Perfil de Cuidador
              <IconChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
