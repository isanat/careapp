"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconLogo, 
  IconCare, 
  IconTrust, 
  IconFamily,
  IconCaregiver,
  IconGlobe,
  IconMail,
  IconPhone,
  IconChevronRight
} from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { PublicLayout } from "@/components/layout/public-layout";

export default function SobrePage() {
  const { t } = useI18n();

  return (
    <PublicLayout>
      <main className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="secondary" className="mb-4">
                {t.sobrePage.badge}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {t.sobrePage.title} {APP_NAME}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t.sobrePage.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{t.sobrePage.mission.title}</h2>
                <p className="text-muted-foreground mb-6">
                  {t.sobrePage.mission.paragraph1}
                </p>
                <p className="text-muted-foreground mb-6">
                  {t.sobrePage.mission.paragraph2}
                </p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary/5 rounded-xl">
                    <IconCare className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold">{t.sobrePage.mission.values.care}</p>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-xl">
                    <IconTrust className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold">{t.sobrePage.mission.values.trust}</p>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-xl">
                    <IconFamily className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold">{t.sobrePage.mission.values.value}</p>
                  </div>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-6">{t.sobrePage.stats.title}</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">2.500+</p>
                      <p className="text-sm text-muted-foreground">{t.sobrePage.stats.caregivers}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">15.000+</p>
                      <p className="text-sm text-muted-foreground">{t.sobrePage.stats.families}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">50.000+</p>
                      <p className="text-sm text-muted-foreground">{t.sobrePage.stats.hours}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">3</p>
                      <p className="text-sm text-muted-foreground">{t.sobrePage.stats.countries}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.sobrePage.values.title}</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconCare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t.sobrePage.values.humanity.title}</h3>
                  <p className="text-muted-foreground">
                    {t.sobrePage.values.humanity.description}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconTrust className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t.sobrePage.values.transparency.title}</h3>
                  <p className="text-muted-foreground">
                    {t.sobrePage.values.transparency.description}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconCaregiver className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t.sobrePage.values.appreciation.title}</h3>
                  <p className="text-muted-foreground">
                    {t.sobrePage.values.appreciation.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.sobrePage.team.title}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t.sobrePage.team.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {t.sobrePage.team.members.map((member, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.sobrePage.contact.title}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t.sobrePage.contact.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-6 text-center">
                  <IconMail className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{t.sobrePage.contact.email}</h3>
                  <p className="text-muted-foreground text-sm">{t.sobrePage.contact.emailValue}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <IconPhone className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{t.sobrePage.contact.phone}</h3>
                  <p className="text-muted-foreground text-sm">{t.sobrePage.contact.phoneValue}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <IconGlobe className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{t.sobrePage.contact.location}</h3>
                  <p className="text-muted-foreground text-sm">{t.sobrePage.contact.locationValue}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">{t.sobrePage.cta.title}</h2>
            <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
              {t.sobrePage.cta.subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/register">
                  {t.sobrePage.cta.familyButton}
                  <IconChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link href="/auth/register?role=caregiver">
                  {t.sobrePage.cta.caregiverButton}
                  <IconChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
