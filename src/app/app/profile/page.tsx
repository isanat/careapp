"use client";

import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { CaregiverProfile } from "./containers/CaregiverProfile";
import { FamilyProfile } from "./containers/FamilyProfile";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const isCaregiver = session?.user?.role === "CAREGIVER";
  const isFamily = session?.user?.role === "FAMILY";

  if (status === "loading") {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!session?.user) {
    return <div className="text-center text-muted-foreground">Não autorizado</div>;
  }

  if (isCaregiver) {
    return <CaregiverProfile />;
  }

  if (isFamily) {
    return <FamilyProfile />;
  }

  return <div className="text-center text-muted-foreground">Papel de utilizador desconhecido</div>;
}
