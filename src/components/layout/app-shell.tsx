"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  IconLogo,
  IconToken,
  IconHome,
  IconSearch,
  IconContract,
  IconWallet,
  IconChat,
  IconSettings,
  IconUser,
  IconBell,
  IconMenu,
  IconX,
} from "@/components/icons";
import { useState } from "react";
import { APP_NAME, TOKEN_SYMBOL } from "@/lib/constants";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isFamily = session?.user?.role === "FAMILY";
  const isCaregiver = session?.user?.role === "CAREGIVER";

  const navItems = isFamily
    ? [
        { href: "/app/dashboard", label: "Dashboard", icon: IconHome },
        { href: "/app/search", label: "Buscar Cuidadores", icon: IconSearch },
        { href: "/app/contracts", label: "Contratos", icon: IconContract },
        { href: "/app/wallet", label: "Carteira", icon: IconWallet },
        { href: "/app/chat", label: "Mensagens", icon: IconChat },
        { href: "/app/settings", label: "Configurações", icon: IconSettings },
      ]
    : [
        { href: "/app/dashboard", label: "Dashboard", icon: IconHome },
        { href: "/app/contracts", label: "Contratos", icon: IconContract },
        { href: "/app/wallet", label: "Carteira", icon: IconWallet },
        { href: "/app/chat", label: "Mensagens", icon: IconChat },
        { href: "/app/profile", label: "Meu Perfil", icon: IconUser },
        { href: "/app/settings", label: "Configurações", icon: IconSettings },
      ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 mx-auto">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
              </Button>
              <Link href="/app/dashboard" className="flex items-center gap-2">
                <IconLogo className="h-8 w-8 text-primary" />
                <span className="font-bold hidden sm:inline">{APP_NAME}</span>
              </Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Token Balance */}
              <Link href="/app/wallet">
                <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5">
                  <IconToken className="h-3.5 w-3.5 text-primary" />
                  <span>2.500 {TOKEN_SYMBOL}</span>
                </Badge>
              </Link>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <IconBell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User Menu */}
              <Link href="/app/settings">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transform transition-transform lg:relative lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "top-16 lg:top-0"
          )}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/app/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Role Badge */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={isFamily ? "default" : "secondary"}>
                  {isFamily ? "Família" : "Cuidador"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isFamily 
                  ? "Encontre cuidadores para seus entes queridos"
                  : "Receba propostas de trabalho"
                }
              </p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 container px-4 py-6 mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
