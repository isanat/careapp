"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconToken, 
  IconEuro, 
  IconArrowUp, 
  IconShield, 
  IconCoins,
  IconWallet,
  IconChevronRight,
  IconContract
} from "@/components/icons";
import { APP_NAME, TOKEN_NAME, TOKEN_SYMBOL } from "@/lib/constants";

export default function TokenPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <IconToken className="h-4 w-4 mr-2" />
              Tokenomics
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {TOKEN_NAME} ({TOKEN_SYMBOL})
            </h1>
            <p className="text-lg text-muted-foreground">
              Um token utilitário com economia real, backing em euro e mecanismo deflacionário. 
              Não é especulação, é valorização baseada em uso real.
            </p>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconEuro className="h-8 w-8 text-primary" />
                </div>
                <p className="text-4xl font-bold mb-1">€1</p>
                <p className="text-muted-foreground">Valor Inicial por Token</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconArrowUp className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-4xl font-bold mb-1">100%</p>
                <p className="text-muted-foreground">Backed em Euro</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconShield className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-4xl font-bold mb-1">Polygon</p>
                <p className="text-muted-foreground">Blockchain Segura</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconCoins className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-4xl font-bold mb-1">Queima</p>
                <p className="text-muted-foreground">Em cada resgate</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why SENT */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Por que o {TOKEN_SYMBOL} é diferente?
              </h2>
              <p className="text-muted-foreground mb-8">
                Não é um token especulativo. É uma ferramenta prática que facilita pagamentos, 
                recompensa cuidadores e valoriza com o uso real da plataforma.
              </p>

              <div className="space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <IconEuro className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Backed em Euro</h3>
                        <p className="text-sm text-muted-foreground">
                          Cada token tem €1 de reserva. Você sempre pode vender pelo valor base.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <IconCoins className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Mecanismo Deflacionário</h3>
                        <p className="text-sm text-muted-foreground">
                          Tokens são queimados em cada resgate. Menos oferta = mais valor.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <IconShield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Blockchain Segura</h3>
                        <p className="text-sm text-muted-foreground">
                          Roda na Polygon - rápida, barata e ecologicamente eficiente.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-center">Comparação</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <span>Criptos especulativas</span>
                    <Badge variant="destructive">Voláteis</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <span>Stablecoins tradicionais</span>
                    <Badge variant="secondary">Sem valorização</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span className="font-medium">{TOKEN_SYMBOL}</span>
                    <Badge className="bg-green-600">Estável + Valoriza</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Token Flow */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Fluxo Econômico do Token</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Entenda como os tokens circulam na plataforma e porque tendem a valorizar.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-500/5 rounded-xl border border-green-500/20">
                  <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconWallet className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-700 mb-2">Entrada</h3>
                  <p className="text-sm text-muted-foreground">
                    € via Stripe → Tokens emitidos → Carteira do usuário
                  </p>
                </div>

                <div className="text-center p-6 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconContract className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-primary mb-2">Uso</h3>
                  <p className="text-sm text-muted-foreground">
                    Taxas de contrato, gorjetas, pagamentos de serviços
                  </p>
                </div>

                <div className="text-center p-6 bg-red-500/5 rounded-xl border border-red-500/20">
                  <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconCoins className="h-7 w-7 text-red-500" />
                  </div>
                  <h3 className="font-semibold text-red-600 mb-2">Saída</h3>
                  <p className="text-sm text-muted-foreground">
                    Tokens vendidos por € → Tokens queimados → Oferta diminui
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-lg font-medium">
                  Mais uso = mais queima = menos oferta = valor tende a subir ↑
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Para que servem os tokens?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <IconContract className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Taxas de Contrato</h3>
                <p className="text-sm text-muted-foreground">
                  Pague €5 em tokens por cada contrato criado na plataforma.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <IconEuro className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Pagamento de Serviços</h3>
                <p className="text-sm text-muted-foreground">
                  Pague cuidadores diretamente com tokens ou cartão.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                  <IconCoins className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold mb-2">Gorjetas</h3>
                <p className="text-sm text-muted-foreground">
                  Recompense cuidadores com tokens que valorizam.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Comece a usar {TOKEN_SYMBOL} hoje</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            Crie sua conta e receba seus primeiros tokens automaticamente.
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
    </main>
  );
}
