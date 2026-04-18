"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconChevronRight, IconCheck } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              {t.pricingPage.badge}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t.pricingPage.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.pricingPage.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Family Card */}
            <Card className="border-primary/20">
              <CardHeader className="text-center pb-2">
                <Badge className="mx-auto mb-4">
                  {t.pricingPage.family.title}
                </Badge>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">
                    {t.pricingPage.family.activationPrice}
                  </span>
                </div>
                <CardDescription>
                  {t.pricingPage.family.activationDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      {t.pricingPage.family.activation}
                    </span>
                    <span className="font-medium">€35</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      {t.pricingPage.family.contractFee}
                    </span>
                    <span className="font-medium">€5</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">
                      {t.pricingPage.family.commission}
                    </span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {t.pricingPage.family.features.map(
                    (feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <IconCheck className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ),
                  )}
                </div>

                <Button className="w-full" asChild>
                  <Link href="/auth/register">
                    {t.pricingPage.cta.button}
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Caregiver Card */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader className="text-center pb-2">
                <Badge className="mx-auto mb-4 bg-green-600">
                  {t.pricingPage.caregiver.title}
                </Badge>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">
                    {t.pricingPage.caregiver.activationPrice}
                  </span>
                </div>
                <CardDescription>
                  {t.pricingPage.caregiver.activationDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      {t.pricingPage.caregiver.activation}
                    </span>
                    <span className="font-medium text-green-600">
                      {t.pricingPage.caregiver.activationPrice}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      {t.pricingPage.caregiver.contractFee}
                    </span>
                    <span className="font-medium">
                      {t.pricingPage.caregiver.contractFeePrice}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">
                      {t.pricingPage.caregiver.commission}
                    </span>
                    <span className="font-medium">
                      {t.pricingPage.caregiver.commissionPrice}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {t.pricingPage.caregiver.features.map(
                    (feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <IconCheck className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ),
                  )}
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  asChild
                >
                  <Link href="/auth/register?role=caregiver">
                    {t.pricingPage.cta.button}
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{t.pricingPage.cta.title}</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            {t.pricingPage.cta.description}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">{t.landing.hero.ctaFamily}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="/auth/register?role=caregiver">
                {t.landing.hero.ctaCaregiver}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
