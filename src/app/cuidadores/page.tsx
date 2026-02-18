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
import { useI18n } from "@/lib/i18n";

export default function CuidadoresPage() {
  const { t } = useI18n();

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
                      {t.forCaregiversPage.benefits.title}
                    </Badge>
                    <h3 className="text-2xl font-bold">{t.forCaregiversPage.cta.button}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <IconEuro className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">85%</p>
                        <p className="text-sm text-muted-foreground">{t.forCaregiversPage.earnings.receive}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <IconCoins className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{t.forCaregiversPage.benefits.tokens.title}</p>
                        <p className="text-sm text-muted-foreground">{TOKEN_SYMBOL}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <IconWallet className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{t.forCaregiversPage.benefits.wallet.title}</p>
                        <p className="text-sm text-muted-foreground">{t.forCaregiversPage.benefits.wallet.description.split('.')[0]}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="order-1 lg:order-2">
              <Badge variant="secondary" className="mb-4">
                {t.forCaregiversPage.badge}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {t.forCaregiversPage.heroTitle}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {t.forCaregiversPage.heroDescription}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth/register?role=caregiver">
                    {t.forCaregiversPage.cta.button}
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
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.forCaregiversPage.benefits.title.replace('IdosoLink', APP_NAME)}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.forCaregiversPage.benefits.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                  <IconWallet className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.forCaregiversPage.benefits.wallet.title}</h3>
                <p className="text-muted-foreground">
                  {t.forCaregiversPage.benefits.wallet.description}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
                  <IconCoins className="h-7 w-7 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.forCaregiversPage.benefits.tokens.title}</h3>
                <p className="text-muted-foreground">
                  {t.forCaregiversPage.benefits.tokens.description.replace('SENT', TOKEN_SYMBOL)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <IconEuro className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.forCaregiversPage.benefits.sell.title}</h3>
                <p className="text-muted-foreground">
                  {t.forCaregiversPage.benefits.sell.description}
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t.forCaregiversPage.earnings.title}</h2>
              <p className="text-muted-foreground mb-8">
                {t.forCaregiversPage.earnings.description.replace('IdosoLink', APP_NAME)}
              </p>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t.forCaregiversPage.earnings.feesTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>{t.forCaregiversPage.earnings.profile}</span>
                    <Badge variant="secondary">{t.forFamiliesPage.pricing.free}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>{t.forCaregiversPage.earnings.activation}</span>
                    <Badge>€25 ({TOKEN_SYMBOL})</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>{t.forCaregiversPage.earnings.contractFee}</span>
                    <Badge>€5 ({TOKEN_SYMBOL})</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span>{t.forCaregiversPage.earnings.receive}</span>
                    <Badge className="bg-green-600">85%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <span>{t.forCaregiversPage.earnings.tipsValue}</span>
                    <Badge className="bg-yellow-600">{TOKEN_SYMBOL}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-center">{t.forCaregiversPage.earnings.example.title}</h3>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-background/50 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">{t.forCaregiversPage.earnings.example.hours}</p>
                    <p className="text-4xl font-bold text-primary">€1.020</p>
                    <p className="text-sm text-muted-foreground">{t.forCaregiversPage.earnings.example.perMonth}</p>
                  </div>
                  <div className="text-center p-6 bg-background/50 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">{t.forCaregiversPage.earnings.example.averageTips}</p>
                    <p className="text-4xl font-bold text-yellow-600">+€150</p>
                    <p className="text-sm text-muted-foreground">{t.forCaregiversPage.earnings.example.inTokens.replace('SENT', TOKEN_SYMBOL)}</p>
                  </div>
                  <div className="border-t pt-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">{t.forCaregiversPage.earnings.example.total}</p>
                    <p className="text-5xl font-bold text-green-600">€1.170</p>
                    <p className="text-sm text-muted-foreground">/ {t.forCaregiversPage.earnings.example.title.split(' ')[0]}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.forCaregiversPage.features.title}</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <IconStar className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t.forCaregiversPage.features.reputation.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.forCaregiversPage.features.reputation.description}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <IconShield className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t.forCaregiversPage.features.protected.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.forCaregiversPage.features.protected.description}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <IconWallet className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t.forCaregiversPage.features.payments.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.forCaregiversPage.features.payments.description}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <IconCoins className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t.forCaregiversPage.features.appreciation.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.forCaregiversPage.features.appreciation.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{t.forCaregiversPage.cta.title}</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            {t.forCaregiversPage.cta.description.replace('IdosoLink', APP_NAME)}
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/register?role=caregiver">
              {t.forCaregiversPage.cta.button}
              <IconChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
