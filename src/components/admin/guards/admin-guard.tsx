"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IconLoader2 } from "@/components/icons";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      // Check if user has admin role
      const checkAdmin = async () => {
        try {
          const response = await fetch("/api/admin/auth");
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin);
          } else {
            setIsAdmin(false);
          }
        } catch {
          setIsAdmin(false);
        }
      };
      checkAdmin();
    }
  }, [status, router]);

  if (status === "loading" || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
        <p className="text-slate-500">
          Você não tem permissão para acessar esta área.
        </p>
        <a
          href="/app/dashboard"
          className="text-cyan-600 hover:text-cyan-700 underline"
        >
          Voltar ao Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
