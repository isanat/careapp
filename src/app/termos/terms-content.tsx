"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconLogo } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

export function TermsContent() {
  const { t, tFn } = useI18n();

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <IconLogo className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">{t.auth.login}</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">{t.auth.register}</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{t.terms.title}</h1>
          <p className="text-muted-foreground mb-8">{t.terms.lastUpdate}</p>

          <Card>
            <CardContent className="p-8 prose prose-lg max-w-none dark:prose-invert">
              <h2>{t.terms.sections.introduction.title}</h2>
              <p>
                {tFn('terms.sections.introduction.content', { appName: APP_NAME })}
              </p>

              <h2>{t.terms.sections.eligibility.title}</h2>
              <p>{t.terms.sections.eligibility.content}</p>
              <ul>
                <li>{t.terms.sections.eligibility.item1}</li>
                <li>{t.terms.sections.eligibility.item2}</li>
                <li>{t.terms.sections.eligibility.item3}</li>
              </ul>

              <h2>{t.terms.sections.accounts.title}</h2>
              <p>{t.terms.sections.accounts.content}</p>
              <ul>
                <li>{t.terms.sections.accounts.item1}</li>
                <li>{t.terms.sections.accounts.item2}</li>
                <li>{t.terms.sections.accounts.item3}</li>
              </ul>

              <h2>{t.terms.sections.services.title}</h2>
              <p>{t.terms.sections.services.content}</p>
              <ul>
                <li>{t.terms.sections.services.item1}</li>
                <li>{t.terms.sections.services.item2}</li>
                <li>{t.terms.sections.services.item3}</li>
              </ul>

              <h2>{t.terms.sections.payments.title}</h2>
              <p>{t.terms.sections.payments.content}</p>
              <ul>
                <li>{t.terms.sections.payments.item1}</li>
                <li>{t.terms.sections.payments.item2}</li>
                <li>{t.terms.sections.payments.item3}</li>
              </ul>

              <h2>{t.terms.sections.tokens.title}</h2>
              <p>{t.terms.sections.tokens.content}</p>
              <ul>
                <li>{t.terms.sections.tokens.item1}</li>
                <li>{t.terms.sections.tokens.item2}</li>
                <li>{t.terms.sections.tokens.item3}</li>
              </ul>

              <h2>{t.terms.sections.prohibited.title}</h2>
              <p>{t.terms.sections.prohibited.content}</p>
              <ul>
                <li>{t.terms.sections.prohibited.item1}</li>
                <li>{t.terms.sections.prohibited.item2}</li>
                <li>{t.terms.sections.prohibited.item3}</li>
                <li>{t.terms.sections.prohibited.item4}</li>
              </ul>

              <h2>{t.terms.sections.liability.title}</h2>
              <p>{t.terms.sections.liability.content}</p>

              <h2>{t.terms.sections.termination.title}</h2>
              <p>{t.terms.sections.termination.content}</p>

              <h2>{t.terms.sections.changes.title}</h2>
              <p>{t.terms.sections.changes.content}</p>

              <h2>{t.terms.sections.contact.title}</h2>
              <p>{t.terms.sections.contact.content}</p>
              <ul>
                <li>{t.terms.sections.contact.email}</li>
                <li>{t.terms.sections.contact.address}</li>
              </ul>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button asChild>
              <Link href="/">{t.back}</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
