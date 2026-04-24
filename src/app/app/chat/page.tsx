"use client";

import { ChatView } from "@isanat/bloom-elements";
import { tokens, cn, getCardClasses, getHeadingClasses, getBadgeClasses } from "@/lib/design-tokens";

function ChatPageContent() {
  return <ChatView />;
}

export default function ChatPage() {
  return (
    <div suppressHydrationWarning>
      <ChatPageContent />
    </div>
  );
}
