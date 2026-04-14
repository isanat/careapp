"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconLogo,
  IconHome,
  IconSearch,
  IconContract,
  IconWallet,
  IconChat,
  IconUser,
  IconMenu,
  IconX,
  IconLogout,
  IconChevronDown,
  IconInbox,
  IconBell,
  IconVideo,
} from "@/components/icons";
import { useState, useEffect } from "react";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";
import { EvyraHeader } from "@/components/layout/EvyraHeader";
import { EvyraSidebar } from "@/components/layout/EvyraSidebar";

interface AppShellProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

// Hook to fetch unread notification count
function useUnreadCount() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/notifications?unreadOnly=true")
        .then((res) => res.json())
        .then((data) => {
          setCount(data.notifications?.length || 0);
        })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  return count;
}

export function AppShell({ children, hideBottomNav = false }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const unreadCount = useUnreadCount();

  const isFamily = session?.user?.role === "FAMILY";
  const isAdmin = session?.user?.role === "ADMIN";

  const navItems = isAdmin
    ? [
        { href: "/app/dashboard", label: t.nav.dashboard, icon: IconHome },
        { href: "/app/admin/payments", label: "Pagamentos", icon: IconWallet },
        { href: "/app/demands", label: "Demandas", icon: IconSearch },
        { href: "/app/contracts", label: t.nav.contracts, icon: IconContract },
        { href: "/app/profile", label: t.nav.profile, icon: IconUser },
      ]
    : isFamily
    ? [
        { href: "/app/dashboard", label: t.nav.dashboard, icon: IconHome },
        { href: "/app/family/demands", label: "Demandas", icon: IconSearch },
        { href: "/app/search", label: t.nav.searchCaregivers, icon: IconSearch },
        { href: "/app/interviews", label: "Entrevistas", icon: IconVideo },
        { href: "/app/contracts", label: t.nav.contracts, icon: IconContract },
        { href: "/app/payments", label: t.nav.wallet, icon: IconWallet },
        { href: "/app/chat", label: t.nav.chat, icon: IconChat },
        { href: "/app/profile", label: t.nav.profile, icon: IconUser },
      ]
    : [
        { href: "/app/dashboard", label: t.nav.dashboard, icon: IconHome },
        { href: "/app/demands", label: "Demandas", icon: IconSearch },
        { href: "/app/interviews", label: "Entrevistas", icon: IconVideo },
        { href: "/app/proposals", label: "Propostas", icon: IconInbox },
        { href: "/app/contracts", label: t.nav.contracts, icon: IconContract },
        { href: "/app/payments", label: t.nav.wallet, icon: IconWallet },
        { href: "/app/chat", label: t.nav.chat, icon: IconChat },
        { href: "/app/profile", label: t.nav.profile, icon: IconUser },
      ];

  // Mobile bottom nav - 5 items for one-handed use
  const mobileNavItems = isFamily
    ? [
        { href: "/app/dashboard", label: "Inicio", icon: IconHome },
        { href: "/app/interviews", label: "Entrevistas", icon: IconVideo },
        { href: "/app/contracts", label: "Contratos", icon: IconContract },
        { href: "/app/chat", label: "Chat", icon: IconChat },
        { href: "/app/profile", label: "Perfil", icon: IconUser },
      ]
    : [
        { href: "/app/dashboard", label: "Inicio", icon: IconHome },
        { href: "/app/interviews", label: "Entrevistas", icon: IconVideo },
        { href: "/app/contracts", label: "Contratos", icon: IconContract },
        { href: "/app/chat", label: "Chat", icon: IconChat },
        { href: "/app/profile", label: "Perfil", icon: IconUser },
      ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const isActiveRoute = (href: string) =>
    pathname === href || (href !== "/app/dashboard" && pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Bloom Elements: Fixed Sidebar + Main with Header */}
      <EvyraSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content with Responsive Padding */}
      <main className={cn(
        "transition-all duration-500 min-h-screen",
        sidebarOpen ? "pl-72" : "pl-20"
      )}>
        {/* Bloom Elements: Sticky Glassmorphic Header */}
        <EvyraHeader sidebarOpen={sidebarOpen} />

        {/* Content Area */}
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>

        {/* Mobile Bottom Navigation (Evyra specific) */}
        <nav className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-t border-border safe-area-inset-bottom lg:hidden",
          hideBottomNav && "hidden",
          sidebarOpen ? "pl-72" : "pl-20"
        )}>
          <div className="flex items-center justify-around h-[3.5rem] px-1">
            {mobileNavItems.map((item) => {
              const active = isActiveRoute(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 min-w-[56px] rounded-2xl transition-all duration-200",
                    active
                      ? "text-primary"
                      : "text-muted-foreground active:scale-95"
                  )}
                >
                  <div className={cn(
                    "relative flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200",
                    active && "bg-primary/15"
                  )}>
                    <Icon className={cn("h-5 w-5", active && "text-primary")} />
                    {item.href === "/app/chat" && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-0.5 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[11px] font-medium leading-tight",
                    active ? "text-primary font-semibold" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
