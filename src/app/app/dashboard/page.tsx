"use client";

import { Suspense } from "react";
import { DashboardView } from "@isanat/bloom-elements";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

function DashboardPageContent() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background px-4 sm:px-6 md:px-8 py-6 md:py-8">
      <DashboardView />
    </main>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
          <Card className="w-full max-w-lg">
            <CardContent className="py-12 text-center">
              <p>{t.loading}</p>
            </CardContent>
          </Card>
        </main>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
