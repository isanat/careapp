"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconLogo, IconMail, IconPhone, IconMapPin, IconClock, IconLoader2, IconCheck, IconAlertCircle } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

export default function ContatoPage() {
  const { t } = useI18n();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
                {success && (
                  <Alert className="mb-4 border-green-500/20 bg-green-500/5">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-600">Mensagem enviada com sucesso!</AlertDescription>
                  </Alert>
                )}
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <IconAlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t.contatoPage.form.name}</Label>
                      <Input id="name" placeholder={t.contatoPage.form.namePlaceholder} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.contatoPage.form.email}</Label>
                      <Input id="email" type="email" placeholder={t.contatoPage.form.emailPlaceholder} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t.contatoPage.form.subject}</Label>
                    <Input id="subject" placeholder={t.contatoPage.form.subjectPlaceholder} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t.contatoPage.form.message}</Label>
                    <Textarea id="message" placeholder={t.contatoPage.form.messagePlaceholder} rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {t.contatoPage.form.submit}
                  </Button>
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
  );
}
