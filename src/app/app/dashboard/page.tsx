"use client";

import { useSession } from "next-auth/react";
import { DashboardView } from "@isanat/bloom-elements";

function DashboardPageContent() {
  const { data: session } = useSession();

  // Determine role from session user role
  const userRole = (session?.user as any)?.role?.toLowerCase() as 'caregiver' | 'family' | undefined;
  const role = userRole === 'family' ? 'family' : 'caregiver';

  return (
    <div suppressHydrationWarning>
      <DashboardView role={role} />
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}
