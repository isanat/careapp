"use client";

import { EntrevistasView } from "@isanat/bloom-elements";

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
