"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IconLogo, IconMail, IconPhone, IconMapPin, IconClock } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { PublicLayout } from "@/components/layout/public-layout";

export default function ContatoPage() {
  const { t } = useI18n();

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{t.contatoPage.title}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.contatoPage.subtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>{t.contatoPage.form.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t.contatoPage.form.name}</Label>
                      <Input id="name" placeholder={t.contatoPage.form.namePlaceholder} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.contatoPage.form.email}</Label>
                      <Input id="email" type="email" placeholder={t.contatoPage.form.emailPlaceholder} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t.contatoPage.form.subject}</Label>
                    <Input id="subject" placeholder={t.contatoPage.form.subjectPlaceholder} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t.contatoPage.form.message}</Label>
                    <Textarea id="message" placeholder={t.contatoPage.form.messagePlaceholder} rows={5} />
                  </div>
                  <Button type="submit" className="w-full">{t.contatoPage.form.submit}</Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <IconMail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t.contatoPage.info.email}</h3>
                      <p className="text-muted-foreground">{t.contatoPage.info.emailValue}</p>
                      <p className="text-muted-foreground">{t.contatoPage.info.emailSupport}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <IconPhone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t.contatoPage.info.phone}</h3>
                      <p className="text-muted-foreground">{t.contatoPage.info.phoneValue}</p>
                      <p className="text-muted-foreground">{t.contatoPage.info.phoneHours}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <IconMapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t.contatoPage.info.address}</h3>
                      <p className="text-muted-foreground">{t.contatoPage.info.addressValue1}</p>
                      <p className="text-muted-foreground">{t.contatoPage.info.addressValue2}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <IconClock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t.contatoPage.info.hours}</h3>
                      <p className="text-muted-foreground">{t.contatoPage.info.hoursWeekday}</p>
                      <p className="text-muted-foreground">{t.contatoPage.info.hoursSaturday}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
