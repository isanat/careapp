"use client";

import { ChatView } from "@isanat/bloom-elements";
import { AppShell } from "@/components/layout/app-shell";
import { BloomSectionHeader } from "@/components/bloom-custom";
import { tokens, cn, getCardClasses, getHeadingClasses, getBadgeClasses } from "@/lib/design-tokens";

function ChatPageContent() {
  return (
    <div className="space-y-6">
      <BloomSectionHeader
        title="Mensagens"
        description="Comunique com famílias e profissionais de saúde."
      />
      <ChatView />
    </div>
  );
}

export default function ChatPage() {
  return (
    <div suppressHydrationWarning>
      <AppShell>
        <ChatPageContent />
      </AppShell>
    </div>
  );
}
