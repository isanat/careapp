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
import { useI18n } from "@/lib/i18n";

export default function TokenPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <IconToken className="h-4 w-4 mr-2" />
              {t.tokenPage.badge}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {TOKEN_NAME} ({TOKEN_SYMBOL})
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.tokenPage.heroDescription}
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
                <p className="text-muted-foreground">{t.tokenPage.metrics.initialValue}</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconArrowUp className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-4xl font-bold mb-1">100%</p>
                <p className="text-muted-foreground">{t.tokenPage.metrics.euroBacked}</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconShield className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-4xl font-bold mb-1">Polygon</p>
                <p className="text-muted-foreground">{t.tokenPage.metrics.blockchain}</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconCoins className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-4xl font-bold mb-1">🔥</p>
                <p className="text-muted-foreground">{t.tokenPage.metrics.burn}</p>
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
                {t.tokenPage.whyDifferent.title}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t.tokenPage.whyDifferent.description}
              </p>

              <div className="space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <IconEuro className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{t.tokenPage.whyDifferent.backed.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t.tokenPage.whyDifferent.backed.description}
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
                        <h3 className="font-semibold">{t.tokenPage.whyDifferent.deflationary.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t.tokenPage.whyDifferent.deflationary.description}
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
                        <h3 className="font-semibold">{t.tokenPage.whyDifferent.blockchain.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t.tokenPage.whyDifferent.blockchain.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-center">{t.tokenPage.comparison.title}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <span>{t.tokenPage.comparison.speculative}</span>
                    <Badge variant="destructive">{t.tokenPage.comparison.volatile}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <span>{t.tokenPage.comparison.stablecoins}</span>
                    <Badge variant="secondary">{t.tokenPage.comparison.noAppreciation}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span className="font-medium">{TOKEN_SYMBOL}</span>
                    <Badge className="bg-green-600">{t.tokenPage.comparison.sent}</Badge>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.tokenPage.flow.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.tokenPage.flow.description}
            </p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-500/5 rounded-xl border border-green-500/20">
                  <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconWallet className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-700 mb-2">{t.tokenPage.flow.entry.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t.tokenPage.flow.entry.description}
                  </p>
                </div>

                <div className="text-center p-6 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconContract className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-primary mb-2">{t.tokenPage.flow.use.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t.tokenPage.flow.use.description}
                  </p>
                </div>

                <div className="text-center p-6 bg-red-500/5 rounded-xl border border-red-500/20">
                  <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconCoins className="h-7 w-7 text-red-500" />
                  </div>
                  <h3 className="font-semibold text-red-600 mb-2">{t.tokenPage.flow.exit.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t.tokenPage.flow.exit.description}
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-lg font-medium">
                  {t.tokenPage.flow.conclusion}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.tokenPage.useCases.title}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <IconContract className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.tokenPage.useCases.contractFees.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.tokenPage.useCases.contractFees.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <IconEuro className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.tokenPage.useCases.payments.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.tokenPage.useCases.payments.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                  <IconCoins className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold mb-2">{t.tokenPage.useCases.tips.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.tokenPage.useCases.tips.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{t.tokenPage.cta.title}</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            {t.tokenPage.cta.description}
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
    </main>
  );
}
