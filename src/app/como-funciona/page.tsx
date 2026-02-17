"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconLogo, 
  IconToken, 
  IconCare, 
  IconFamily, 
  IconCaregiver, 
  IconTrust, 
  IconWallet,
  IconContract,
  IconChevronRight,
  IconShield,
  IconCoins,
  IconCheck
} from "@/components/icons";
import { APP_NAME, TOKEN_NAME, TOKEN_SYMBOL } from "@/lib/constants";

export default function ComoFuncionaPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              Guia Completo
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Como Funciona o {APP_NAME}
            </h1>
            <p className="text-lg text-muted-foreground">
              Uma plataforma simples e segura que conecta famílias a cuidadores de idosos, 
              usando tecnologia blockchain para garantir transparência e confiança.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="flex gap-6 mb-12">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Cadastro & Escolha de Perfil</h2>
                <p className="text-muted-foreground mb-4">
                  Crie sua conta em menos de 2 minutos. Escolha se você é uma família buscando 
                  cuidados ou um cuidador oferecendo serviços.
                </p>
                <Card>
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <IconFamily className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold">Família</p>
                          <p className="text-sm text-muted-foreground">Busca cuidadores</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <IconCaregiver className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold">Cuidador</p>
                          <p className="text-sm text-muted-foreground">Oferece serviços</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 mb-12">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Ativação da Conta</h2>
                <p className="text-muted-foreground mb-4">
                  Pague a taxa única de ativação de €25 e receba automaticamente seus primeiros 
                  tokens na sua carteira digital integrada.
                </p>
                <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/20 rounded-full">
                        <IconToken className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Taxa de Ativação: €25</p>
                        <p className="text-sm text-muted-foreground">
                          Você recebe 25 {TOKEN_SYMBOL} tokens na sua carteira
                        </p>
                      </div>
                      <Badge className="bg-primary">1:1 com Euro</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 mb-12">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Match & Conexão</h2>
                <p className="text-muted-foreground mb-4">
                  Famílias buscam cuidadores por localização, especialidade e preço. 
                  Cuidadores recebem propostas e podem aceitar ou recusar.
                </p>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <IconCheck className="h-5 w-5 text-green-500" />
                        <span>Busca por distância e disponibilidade</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <IconCheck className="h-5 w-5 text-green-500" />
                        <span>Filtro por especialidades (Alzheimer, Paliativos, etc.)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <IconCheck className="h-5 w-5 text-green-500" />
                        <span>Verificação de qualificações e antecedentes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <IconCheck className="h-5 w-5 text-green-500" />
                        <span>Sistema de avaliações e reputação</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 mb-12">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Contrato Digital</h2>
                <p className="text-muted-foreground mb-4">
                  Crie contratos claros e registrados na blockchain. Taxa de €5 por contrato, 
                  garantindo segurança jurídica para ambas as partes.
                </p>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <IconContract className="h-10 w-10 text-primary" />
                      <div className="flex-1">
                        <p className="font-semibold">Contratos Imutáveis</p>
                        <p className="text-sm text-muted-foreground">
                          Registrados na blockchain Polygon para máxima segurança
                        </p>
                      </div>
                      <Badge variant="outline">€5/contrato</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  5
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Pagamentos & Valorização</h2>
                <p className="text-muted-foreground mb-4">
                  Pague serviços com segurança usando tokens ou cartão. Cuidadores acumulam 
                  tokens que valorizam com o crescimento da plataforma.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="p-4 text-center">
                      <IconWallet className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold text-green-700">Carteira Digital</p>
                      <p className="text-xs text-muted-foreground">Tokens backed em Euro</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-500/5 border-yellow-500/20">
                    <CardContent className="p-4 text-center">
                      <IconCoins className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="font-semibold text-yellow-700">Gorjetas</p>
                      <p className="text-xs text-muted-foreground">Valorizam cuidadores</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <IconTrust className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold text-primary">Segurança</p>
                      <p className="text-xs text-muted-foreground">100% garantido</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            Junte-se a milhares de famílias e cuidadores que já confiam no {APP_NAME}.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                Sou Familiar
                <IconChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/auth/register?role=caregiver">
                Sou Cuidador
                <IconChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
