"use client";

import { Suspense } from "react";
import { ChatView } from "@isanat/bloom-elements";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

function ChatPageContent() {
  return <ChatView />;
}

export default function ChatPage() {
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
      <ChatPageContent />
    </Suspense>
  );
}
