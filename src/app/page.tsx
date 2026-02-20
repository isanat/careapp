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
import { useI18n } from "@/lib/i18n";

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 py-16 md:py-24 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                🇪🇺 {t.landing.badge}
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t.landing.hero.title}
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">
                {t.landing.hero.subtitle}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth/register">
                    {t.landing.hero.ctaFamily}
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/register?role=caregiver">
                    {t.landing.hero.ctaCaregiver}
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t mt-8">
                <div>
                  <p className="text-3xl font-bold text-primary">2.500+</p>
                  <p className="text-sm text-muted-foreground">{t.landing.stats.caregivers}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">15.000+</p>
                  <p className="text-sm text-muted-foreground">{t.landing.stats.families}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">4.9★</p>
                  <p className="text-sm text-muted-foreground">{t.dashboard.rating}</p>
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
                    <CardDescription>{t.landing.token.title}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <IconArrowUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">{t.landing.token.appreciation.title}</p>
                    <p className="text-sm text-muted-foreground">{t.landing.token.appreciation.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <IconShield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{t.landing.token.backed.title}</p>
                    <p className="text-sm text-muted-foreground">{t.landing.token.backed.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <IconCoins className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">{t.landing.token.deflationary.title}</p>
                    <p className="text-sm text-muted-foreground">{t.landing.token.deflationary.description}</p>
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
                    <IconWallet className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{t.landing.features.blockchain.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t.landing.features.blockchain.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconTrust className="h-6 w-6 text-primary" />
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
