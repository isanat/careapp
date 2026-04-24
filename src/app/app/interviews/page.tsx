"use client";

import { EntrevistasView } from "@isanat/bloom-elements";
import { tokens, cn, getCardClasses, getHeadingClasses, getBadgeClasses } from "@/lib/design-tokens";

function EntrevistasPageContent() {
  return <EntrevistasView />;
}

export default function EntrevistasPage() {
  return (
    <div suppressHydrationWarning>
      <EntrevistasPageContent />
    </div>
  );
}
