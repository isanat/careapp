"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { DashboardView } from "@isanat/bloom-elements";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

function DashboardPageContent() {
  const { data: session } = useSession();

  // Determine role from session user role
  const userRole = (session?.user as any)?.role?.toLowerCase() as 'caregiver' | 'family' | undefined;
  const role = userRole === 'family' ? 'family' : 'caregiver';

  return <DashboardView role={role} />;
}

export default function DashboardPage() {
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
      <DashboardPageContent />
    </Suspense>
  );
}
