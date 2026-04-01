"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/layout/public-layout";
import { 
  IconCare, 
  IconTrust,
  IconChevronRight,
  IconShield,
  IconStar,
  IconContract
} from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-500/5 via-teal-500/5 to-background">
        <div className="container px-4 py-16 md:py-32 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                Para quem precisa de apoio em casa · Portugal, Espanha, Itália
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Confiança é{" "}
                <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  infraestrutura.
                </span>{" "}
                Nós somos essa infraestrutura.
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                QR code diário. Histórico de visitas. Contratos assinados. Tudo online. Sem ligar para perguntar todo o dia. Sem surpresas.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/auth/register">
                    Sou Família
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/register?role=caregiver">
                    Sou Profissional
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t mt-8">
                <div>
                  <p className="text-3xl font-bold text-primary">50+</p>
                  <p className="text-sm text-muted-foreground">{t.landing.stats.caregivers}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">100+</p>
                  <p className="text-sm text-muted-foreground">{t.landing.stats.families}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">4.9★</p>
                  <p className="text-sm text-muted-foreground">{t.dashboard.rating}</p>
                </div>
              </div>
            </div>

            {/* Right Content - 3 Pilares */}
            <Card className="bg-gradient-to-br from-blue-500/10 via-teal-500/10 to-background border-blue-200/50">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconCare className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">3 Pilares da Evyra</h3>
                  <p className="text-muted-foreground">O que nos distingue</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-lg border border-blue-200/30">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0"></div>
                    <div>
                      <p className="font-bold text-sm">Infraestrutura Digital</p>
                      <p className="text-xs text-muted-foreground">Contratos seguros, pagamentos transparentes, protecção de dados RGPD</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-teal-500/5 rounded-lg border border-teal-200/30">
                    <div className="w-2 h-2 bg-teal-600 rounded-full mt-2 shrink-0"></div>
                    <div>
                      <p className="font-bold text-sm">Padrão Europeu</p>
                      <p className="text-xs text-muted-foreground">Desenvolvido para Portugal, Espanha e Itália. RGPD em primeiro lugar. Suporte multilingue</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-500/5 rounded-lg border border-slate-200/30">
                    <div className="w-2 h-2 bg-slate-600 rounded-full mt-2 shrink-0"></div>
                    <div>
                      <p className="font-bold text-sm">Valorização do Profissional</p>
                      <p className="text-xs text-muted-foreground">Pagamentos justos (90% de comissão), reconhecimento profissional, ferramentas de carreira</p>
                    </div>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.landing.howItWorks.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.landing.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.howItWorks.step1.title}</h3>
              <p className="text-muted-foreground">
                {t.landing.howItWorks.step1.description}
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.howItWorks.step2.title}</h3>
              <p className="text-muted-foreground">
                {t.landing.howItWorks.step2.description}
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.howItWorks.step3.title}</h3>
              <p className="text-muted-foreground">
                {t.landing.howItWorks.step3.description}
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.howItWorks.step4.title}</h3>
              <p className="text-muted-foreground">
                {t.landing.howItWorks.step4.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.landing.features.title}</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconShield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{t.landing.features.verified.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t.landing.features.verified.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconContract className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{t.landing.features.contracts.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t.landing.features.contracts.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconTrust className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{t.landing.features.security.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t.landing.features.security.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconCare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{t.landing.features.support.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t.landing.features.support.description}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.landing.cta.title}
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            {t.landing.cta.subtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                {t.landing.hero.ctaFamily}
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/auth/register?role=caregiver">
                {t.landing.hero.ctaCaregiver}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
