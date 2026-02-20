"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconLogo, IconCheck, IconWallet, IconToken, IconArrowUp } from "@/components/icons";
import { APP_NAME, TOKEN_NAME, TOKEN_SYMBOL } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { t } = useI18n();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <IconCheck className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t.success.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>{t.success.message}</p>
            <p>{t.success.readyToStart} {APP_NAME}.</p>
          </div>

          {/* What happened */}
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <IconWallet className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{t.success.walletCreated}</p>
                <p className="text-sm text-muted-foreground">{t.success.walletCreatedDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconToken className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t.success.tokensCredited}</p>
                <p className="text-sm text-muted-foreground">{t.success.tokensCreditedDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconArrowUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t.success.potentialAppreciation}</p>
                <p className="text-sm text-muted-foreground">{t.success.potentialAppreciationDesc}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t.success.nextSteps}</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t.success.completeProfile}</li>
              <li>{t.success.verifyAccount}</li>
              <li>{t.success.startSearching}</li>
            </ul>
          </div>

          <Button asChild className="w-full" size="lg">
            <Link href="/app/dashboard">
              {t.success.goToDashboard}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function SuccessPage() {
  const { t } = useI18n();
  
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12 text-center">
            <p>{t.loading}</p>
          </CardContent>
        </Card>
      </main>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
