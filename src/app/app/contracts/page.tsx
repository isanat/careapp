"use client";

import { ContratosView } from "@isanat/bloom-elements";

function ContratosPageContent() {
  return <ContratosView />;
}

export default function ContratosPage() {
  return (
    <div suppressHydrationWarning>
      <ContratosPageContent />
    </div>
  );
}
