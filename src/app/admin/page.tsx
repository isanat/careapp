"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@/components/icons";

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <IconLoader2 className="h-8 w-8 animate-spin text-cyan-600" />
    </div>
  );
}
