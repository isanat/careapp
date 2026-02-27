"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconLogo, IconFamily, IconCaregiver, IconShield } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { PublicLayout } from "@/components/layout/public-layout";

export default function AjudaPage() {
  const { t } = useI18n();

  const faqs = [
    {
      category: t.ajudaPage.categories.forFamilies,
      icon: IconFamily,
      questions: t.ajudaPage.faqs.families
    },
    {
      category: t.ajudaPage.categories.forCaregivers,
      icon: IconCaregiver,
      questions: t.ajudaPage.faqs.caregivers
    },
    {
      category: t.ajudaPage.categories.security,
      icon: IconShield,
      questions: t.ajudaPage.faqs.security
    }
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{t.ajudaPage.title}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.ajudaPage.subtitle}
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="max-w-4xl mx-auto space-y-8">
            {faqs.map((section) => (
              <Card key={section.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <section.icon className="h-6 w-6 text-primary" />
                    {section.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {section.questions.map((faq: { q: string; a: string }, index: number) => (
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <h3 className="font-semibold mb-2">{faq.q}</h3>
                        <p className="text-muted-foreground">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-2">{t.ajudaPage.notFound}</h2>
                <p className="text-muted-foreground mb-4">
                  {t.ajudaPage.supportReady}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href="/contato">{t.ajudaPage.contactSupport}</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="mailto:suporte@idosolink.com">suporte@idosolink.com</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
