"use client";

import { useSession } from "next-auth/react";
import { DashboardView } from "@isanat/bloom-elements";

function DashboardPageContent() {
  const { data: session } = useSession();

  // Extract user data from session
  const userRole = (session?.user as any)?.role?.toLowerCase() as 'caregiver' | 'family' | undefined;
  const role = userRole === 'family' ? 'family' : 'caregiver';
  const userName = (session?.user as any)?.name || 'Usuário';

  // Role-specific titles
  const userTitle = role === 'caregiver'
    ? (session?.user as any)?.profession || 'Profissional de Saúde'
    : 'Gestor Familiar';

  return (
    <div suppressHydrationWarning>
      <DashboardView
        role={role}
        userName={userName}
        userTitle={userTitle}
      />
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}
