"use client";

import { AdminLayout } from "@/components/admin/layout/admin-layout";
import { AdminGuard } from "@/components/admin/guards/admin-guard";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}
