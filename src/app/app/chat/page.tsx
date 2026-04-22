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
        <div className="flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="py-12 text-center">
              <p>{t.loading}</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
