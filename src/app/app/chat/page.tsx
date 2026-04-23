"use client";

import { ChatView } from "@isanat/bloom-elements";

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
