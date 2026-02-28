"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconLogo } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

export default function PrivacidadePage() {
  const { t } = useI18n();

  const sections: Array<{ title: string; content: string; items?: string[] }> = [
    t.privacidadePage.sections.introduction,
    t.privacidadePage.sections.dataCollected,
    t.privacidadePage.sections.dataUsage,
    t.privacidadePage.sections.dataSharing,
    t.privacidadePage.sections.security,
    t.privacidadePage.sections.rights,
    t.privacidadePage.sections.cookies,
    t.privacidadePage.sections.contact,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">{t.privacidadePage.title}</h1>
            <p className="text-muted-foreground mb-8">{t.privacidadePage.lastUpdate}</p>

            <Card>
              <CardContent className="p-8 prose prose-lg max-w-none dark:prose-invert">
                {sections.map((section, index) => (
                  <div key={index} className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                    <p className="text-muted-foreground mb-4">{section.content}</p>
                    {section.items && (
                      <ul className="list-disc pl-6 space-y-2">
                        {section.items.map((item: string, idx: number) => (
                          <li key={idx} className="text-muted-foreground">{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <Button asChild>
                <Link href="/">{t.privacidadePage.backHome}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
}
