"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  IconMenu,
  IconBell,
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronRight,
  IconHome,
} from "@/components/icons";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

const breadcrumbMap: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "Usuários",
  "/admin/caregivers": "Cuidadores",
  "/admin/contracts": "Contratos",
  "/admin/payments": "Pagamentos",
  "/admin/tokens": "Tokens",
  "/admin/moderation": "Moderação",
  "/admin/settings": "Configurações",
  "/admin/analytics": "Analytics",
  "/admin/logs": "Logs",
  "/admin/notifications": "Notificações",
  "/admin/support": "Suporte",
};

export function AdminHeader({ onMenuClick, sidebarCollapsed }: AdminHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Build breadcrumb
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const href = "/" + pathParts.slice(0, index + 1).join("/");
    const label = breadcrumbMap[href] || part;
    return { href, label };
  });

  return (
    <header className="sticky top-0 z-20 border-b bg-white dark:bg-slate-800">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <IconMenu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link
              href="/admin/dashboard"
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <IconHome className="h-4 w-4" />
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-1">
                <IconChevronRight className="h-4 w-4 text-slate-400" />
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-slate-900 dark:text-white">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile title */}
          <h1 className="text-lg font-semibold md:hidden">
            {breadcrumbs[breadcrumbs.length - 1]?.label || "Admin"}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <IconBell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              3
            </span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                  {session?.user?.name?.charAt(0) || "A"}
                </div>
                <span className="hidden font-medium md:inline-block">
                  {session?.user?.name || "Admin"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-slate-500">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/dashboard" className="flex items-center gap-2">
                  <IconUser className="h-4 w-4" />
                  Ver como Usuário
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="flex items-center gap-2">
                  <IconSettings className="h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600"
              >
                <IconLogout className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
