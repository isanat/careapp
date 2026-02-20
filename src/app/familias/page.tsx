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
import { APP_NAME, TOKEN_SYMBOL } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

export default function FamiliasPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                {t.forFamiliesPage.badge}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {t.forFamiliesPage.heroTitle}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {t.forFamiliesPage.heroDescription}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth/register">
                    {t.landing.hero.cta}
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/como-funciona">
                    {t.nav.howItWorks}
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
                      <p className="text-sm text-muted-foreground">{t.forFamiliesPage.stats.caregivers}</p>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-xl">
                      <p className="text-4xl font-bold text-primary">15.000+</p>
                      <p className="text-sm text-muted-foreground">{t.forFamiliesPage.stats.families}</p>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-xl">
                      <p className="text-4xl font-bold text-primary">4.9★</p>
                      <p className="text-sm text-muted-foreground">{t.forFamiliesPage.stats.rating}</p>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-xl">
                      <p className="text-4xl font-bold text-primary">24/7</p>
                      <p className="text-sm text-muted-foreground">{t.forFamiliesPage.stats.support}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.forFamiliesPage.whyChoose.title.replace('IdosoLink', APP_NAME)}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.forFamiliesPage.whyChoose.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <IconTrust className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.forFamiliesPage.whyChoose.verified.title}</h3>
                <p className="text-muted-foreground">
                  {t.forFamiliesPage.whyChoose.verified.description}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <IconShield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.forFamiliesPage.whyChoose.contracts.title}</h3>
                <p className="text-muted-foreground">
                  {t.forFamiliesPage.whyChoose.contracts.description}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <IconStar className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.forFamiliesPage.whyChoose.reputation.title}</h3>
                <p className="text-muted-foreground">
                  {t.forFamiliesPage.whyChoose.reputation.description}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.forFamiliesPage.howItWorks.title}</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold mb-2">{t.forFamiliesPage.howItWorks.step1}</h3>
              <p className="text-sm text-muted-foreground">{t.forFamiliesPage.howItWorks.step1Desc}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold mb-2">{t.forFamiliesPage.howItWorks.step2}</h3>
              <p className="text-sm text-muted-foreground">{t.forFamiliesPage.howItWorks.step2Desc}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold mb-2">{t.forFamiliesPage.howItWorks.step3}</h3>
              <p className="text-sm text-muted-foreground">{t.forFamiliesPage.howItWorks.step3Desc}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                4
              </div>
              <h3 className="font-semibold mb-2">{t.forFamiliesPage.howItWorks.step4}</h3>
              <p className="text-sm text-muted-foreground">{t.forFamiliesPage.howItWorks.step4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t.forFamiliesPage.pricing.title}</h2>
              <p className="text-muted-foreground mb-8">
                {t.forFamiliesPage.pricing.description}
              </p>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t.forFamiliesPage.pricing.feesTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <IconSearch className="h-5 w-5 text-muted-foreground" />
                      {t.forFamiliesPage.pricing.search}
                    </span>
                    <Badge variant="secondary">{t.forFamiliesPage.pricing.free}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <IconWallet className="h-5 w-5 text-muted-foreground" />
                      {t.forFamiliesPage.pricing.activation}
                    </span>
                    <Badge>€25 ({TOKEN_SYMBOL})</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <IconContract className="h-5 w-5 text-muted-foreground" />
                      {t.forFamiliesPage.pricing.contractFee}
                    </span>
                    <Badge>€5 ({TOKEN_SYMBOL})</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>{t.forFamiliesPage.pricing.commission}</span>
                    <Badge variant="outline">15%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>{t.forFamiliesPage.pricing.tips}</span>
                    <Badge variant="secondary">{t.forFamiliesPage.pricing.optional}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6">{t.forFamiliesPage.included.title}</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t.forFamiliesPage.included.access}</p>
                      <p className="text-sm text-muted-foreground">{t.forFamiliesPage.included.accessDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t.forFamiliesPage.included.verification}</p>
                      <p className="text-sm text-muted-foreground">{t.forFamiliesPage.included.verificationDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t.forFamiliesPage.included.support}</p>
                      <p className="text-sm text-muted-foreground">{t.forFamiliesPage.included.supportDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t.forFamiliesPage.included.protected}</p>
                      <p className="text-sm text-muted-foreground">{t.forFamiliesPage.included.protectedDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t.forFamiliesPage.included.guarantee}</p>
                      <p className="text-sm text-muted-foreground">{t.forFamiliesPage.included.guaranteeDesc}</p>
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
          <h2 className="text-3xl font-bold mb-4">{t.forFamiliesPage.cta.title}</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            {t.forFamiliesPage.cta.description}
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/register">
              {t.forFamiliesPage.cta.button}
              <IconChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
