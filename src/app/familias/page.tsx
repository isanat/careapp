"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconFamily, 
  IconTrust, 
  IconShield, 
  IconStar,
  IconSearch,
  IconContract,
  IconWallet,
  IconChevronRight,
  IconCheck
} from "@/components/icons";
import { APP_NAME } from "@/lib/constants";

export default function FamiliasPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                Para Famílias
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Encontre cuidadores de confiança para seus entes queridos
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                A plataforma que oferece transparência, segurança e qualidade no cuidado de idosos. 
                Cada contrato é registrado na blockchain, garantindo imutabilidade e confiança.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth/register">
                    Começar Agora
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
            <div className="hidden lg:block">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-background/50 rounded-xl">
                      <p className="text-4xl font-bold text-primary">2.500+</p>
                      <p className="text-sm text-muted-foreground">Cuidadores</p>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-xl">
                      <p className="text-4xl font-bold text-primary">15.000+</p>
                      <p className="text-sm text-muted-foreground">Famílias</p>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-xl">
                      <p className="text-4xl font-bold text-primary">4.9★</p>
                      <p className="text-sm text-muted-foreground">Avaliação</p>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-xl">
                      <p className="text-4xl font-bold text-primary">24/7</p>
                      <p className="text-sm text-muted-foreground">Suporte</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que escolher o {APP_NAME}?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Segurança, transparência e qualidade em cada etapa do cuidado.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <IconTrust className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Cuidadores Verificados</h3>
                <p className="text-muted-foreground">
                  Verificação completa de identidade, antecedentes criminais e qualificações profissionais.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <IconShield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Contratos Imutáveis</h3>
                <p className="text-muted-foreground">
                  Registrados na blockchain para máxima segurança jurídica. Não podem ser alterados ou falsificados.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <IconStar className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sistema de Reputação</h3>
                <p className="text-muted-foreground">
                  Avaliações reais de famílias atendidas. Veja histórico completo antes de contratar.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona para famílias</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold mb-2">Crie sua conta</h3>
              <p className="text-sm text-muted-foreground">Cadastro rápido e gratuito</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold mb-2">Ative sua conta</h3>
              <p className="text-sm text-muted-foreground">€25 em tokens inclusos</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold mb-2">Encontre cuidadores</h3>
              <p className="text-sm text-muted-foreground">Busque por perfil e local</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                4
              </div>
              <h3 className="font-semibold mb-2">Contrate com segurança</h3>
              <p className="text-sm text-muted-foreground">Contrato digital imutável</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Investimento Transparente</h2>
              <p className="text-muted-foreground mb-8">
                Sem surpresas. Todos os custos são claros desde o início. 
                Você só paga pelo que usa.
              </p>
              
              <Card>
                <CardHeader>
                  <CardTitle>Taxas para Famílias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <IconSearch className="h-5 w-5 text-muted-foreground" />
                      Busca de cuidadores
                    </span>
                    <Badge variant="secondary">Grátis</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <IconWallet className="h-5 w-5 text-muted-foreground" />
                      Ativação da conta
                    </span>
                    <Badge>€25 (em tokens)</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <IconContract className="h-5 w-5 text-muted-foreground" />
                      Taxa por contrato
                    </span>
                    <Badge>€5 (em tokens)</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Comissão da plataforma</span>
                    <Badge variant="outline">15%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Gorjetas em tokens</span>
                    <Badge variant="secondary">Opcional</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6">O que está incluído</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Acesso ilimitado a cuidadores</p>
                      <p className="text-sm text-muted-foreground">Busque e contate quantos quiser</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Verificação completa</p>
                      <p className="text-sm text-muted-foreground">Antecedentes e qualificações</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Suporte dedicado</p>
                      <p className="text-sm text-muted-foreground">Chat e telefone 24/7</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Contratos protegidos</p>
                      <p className="text-sm text-muted-foreground">Registro blockchain imutável</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Garantia de satisfação</p>
                      <p className="text-sm text-muted-foreground">Reembolso em até 7 dias</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Comece hoje mesmo</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            Encontre o cuidador ideal para sua família em poucos minutos.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/register">
              Criar Conta Gratuita
              <IconChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
