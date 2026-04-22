"use client";

import { Suspense } from "react";
import { EntrevistasView } from "@isanat/bloom-elements";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

function EntrevistasPageContent() {
  return <EntrevistasView />;
}

export default function EntrevistasPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="py-12 text-center">
              <p>{t.loading}</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <EntrevistasPageContent />
    </Suspense>
  );
}
