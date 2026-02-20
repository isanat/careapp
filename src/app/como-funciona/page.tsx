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
import { useI18n } from "@/lib/i18n";

export default function ComoFuncionaPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              {t.howItWorksPage.badge}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t.nav.howItWorks} {APP_NAME}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.howItWorksPage.heroDescription}
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
                <h2 className="text-2xl font-bold mb-2">{t.howItWorksPage.steps.signup.title}</h2>
                <p className="text-muted-foreground mb-4">
                  {t.howItWorksPage.steps.signup.description}
                </p>
                <Card>
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <IconFamily className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold">{t.howItWorksPage.steps.signup.family}</p>
                          <p className="text-sm text-muted-foreground">{t.howItWorksPage.steps.signup.familyDesc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <IconCaregiver className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold">{t.howItWorksPage.steps.signup.caregiver}</p>
                          <p className="text-sm text-muted-foreground">{t.howItWorksPage.steps.signup.caregiverDesc}</p>
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
                <h2 className="text-2xl font-bold mb-2">{t.howItWorksPage.steps.activation.title}</h2>
                <p className="text-muted-foreground mb-4">
                  {t.howItWorksPage.steps.activation.description}
                </p>
                <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/20 rounded-full">
                        <IconToken className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{t.howItWorksPage.steps.activation.fee}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.howItWorksPage.steps.activation.feeDesc}
                        </p>
                      </div>
                      <Badge className="bg-primary">1:1 {t.auth.email.startsWith('E') ? 'with Euro' : 'com Euro'}</Badge>
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
                <h2 className="text-2xl font-bold mb-2">{t.howItWorksPage.steps.match.title}</h2>
                <p className="text-muted-foreground mb-4">
                  {t.howItWorksPage.steps.match.description}
                </p>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {t.howItWorksPage.steps.match.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                          <IconCheck className="h-5 w-5 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
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
                <h2 className="text-2xl font-bold mb-2">{t.howItWorksPage.steps.contract.title}</h2>
                <p className="text-muted-foreground mb-4">
                  {t.howItWorksPage.steps.contract.description}
                </p>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <IconContract className="h-10 w-10 text-primary" />
                      <div className="flex-1">
                        <p className="font-semibold">{t.howItWorksPage.steps.contract.immutable}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.howItWorksPage.steps.contract.immutableDesc}
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
                <h2 className="text-2xl font-bold mb-2">{t.howItWorksPage.steps.payments.title}</h2>
                <p className="text-muted-foreground mb-4">
                  {t.howItWorksPage.steps.payments.description}
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="p-4 text-center">
                      <IconWallet className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold text-green-700">{t.howItWorksPage.steps.payments.wallet}</p>
                      <p className="text-xs text-muted-foreground">{t.howItWorksPage.steps.payments.walletDesc}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-500/5 border-yellow-500/20">
                    <CardContent className="p-4 text-center">
                      <IconCoins className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="font-semibold text-yellow-700">{t.howItWorksPage.steps.payments.tips}</p>
                      <p className="text-xs text-muted-foreground">{t.howItWorksPage.steps.payments.tipsDesc}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <IconTrust className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold text-primary">{t.howItWorksPage.steps.payments.security}</p>
                      <p className="text-xs text-muted-foreground">{t.howItWorksPage.steps.payments.securityDesc}</p>
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
          <h2 className="text-3xl font-bold mb-4">{t.howItWorksPage.cta.title}</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            {t.howItWorksPage.cta.description}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                {t.landing.hero.ctaFamily}
                <IconChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/auth/register?role=caregiver">
                {t.landing.hero.ctaCaregiver}
                <IconChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
