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
} from "@/components/icons";
import { useState, useEffect } from "react";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";

interface AppShellProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

// Hook to fetch user wallet data
function useUserWallet() {
  const { data: session } = useSession();
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user/wallet")
        .then((res) => res.json())
        .then((data) => {
          if (data.balance !== undefined) {
            setWallet({ balance: data.balance });
          }
        })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  return wallet;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const wallet = useUserWallet();
  const unreadCount = useUnreadCount();

  const isFamily = session?.user?.role === "FAMILY";

  const navItems = isFamily
    ? [
        { href: "/app/dashboard", label: t.nav.dashboard, icon: IconHome },
        { href: "/app/search", label: t.nav.searchCaregivers, icon: IconSearch },
        { href: "/app/contracts", label: t.nav.contracts, icon: IconContract },
        { href: "/app/wallet", label: t.nav.wallet, icon: IconWallet },
        { href: "/app/chat", label: t.nav.chat, icon: IconChat },
        { href: "/app/profile", label: t.nav.profile, icon: IconUser },
      ]
    : [
        { href: "/app/dashboard", label: t.nav.dashboard, icon: IconHome },
        { href: "/app/proposals", label: "Propostas", icon: IconInbox },
        { href: "/app/contracts", label: t.nav.contracts, icon: IconContract },
        { href: "/app/wallet", label: t.nav.wallet, icon: IconWallet },
        { href: "/app/chat", label: t.nav.chat, icon: IconChat },
        { href: "/app/profile", label: t.nav.profile, icon: IconUser },
      ];

  // Mobile bottom nav - 5 items for one-handed use
  const mobileNavItems = isFamily
    ? [
        { href: "/app/dashboard", label: "Inicio", icon: IconHome },
        { href: "/app/search", label: "Buscar", icon: IconSearch },
        { href: "/app/contracts", label: "Contratos", icon: IconContract },
        { href: "/app/chat", label: "Chat", icon: IconChat },
        { href: "/app/profile", label: "Perfil", icon: IconUser },
      ]
    : [
        { href: "/app/dashboard", label: "Inicio", icon: IconHome },
        { href: "/app/proposals", label: "Propostas", icon: IconInbox },
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header - Clean white, dark blue text */}
      <header className="sticky top-0 z-50 bg-white dark:bg-surface border-b border-border/50 safe-area-inset-top">
        <div className="px-4 lg:px-6 mx-auto max-w-7xl">
          <div className="flex h-14 lg:h-16 items-center justify-between">
            {/* Left: Logo & Mobile Menu */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
              </Button>
              <Link href="/app/dashboard" className="flex items-center gap-2">
                <IconLogo className="h-8 w-8" />
                <span className="font-bold text-lg hidden sm:inline text-foreground">
                  {APP_NAME}
                </span>
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
              {/* Theme & Language (Desktop) */}
              <div className="hidden md:flex items-center gap-1">
                <ThemeToggle />
                <LanguageSelector />
              </div>

              {/* Notifications */}
              <Link href="/app/notifications">
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <IconBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-warm text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 h-9 px-2">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-semibold">
                        {session?.user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <IconChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-surface border shadow-soft-md">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {isFamily ? t.auth.family : t.auth.caregiver}
                    </Badge>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/app/dashboard" className="flex items-center">
                      <IconHome className="mr-2 h-4 w-4" />
                      {t.nav.dashboard}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/profile" className="flex items-center">
                      <IconUser className="mr-2 h-4 w-4" />
                      {t.nav.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/wallet" className="flex items-center">
                      <IconWallet className="mr-2 h-4 w-4" />
                      {t.nav.wallet}
                    </Link>
                  </DropdownMenuItem>

                  {/* Theme & Language in mobile dropdown */}
                  <div className="md:hidden">
                    <DropdownMenuSeparator />
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-sm">{t.theme.light}/{t.theme.dark}</span>
                      <ThemeToggle />
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-sm">{t.language.select}</span>
                      <LanguageSelector />
                    </div>
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-error focus:text-error"
                  >
                    <IconLogout className="mr-2 h-4 w-4" />
                    {t.auth.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex pb-[4.5rem] lg:pb-0">
        {/* Sidebar (Desktop) */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-surface border-r border-border/50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 shadow-soft lg:shadow-none",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "top-14 lg:top-0"
          )}
        >
          <nav className="p-3 space-y-1 mt-2 lg:mt-4">
            {navItems.map((item) => {
              const active = isActiveRoute(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {item.href === "/app/chat" && unreadCount > 0 && !active && (
                    <span className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-warm text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Wallet Balance in sidebar */}
          <div className="absolute bottom-4 left-3 right-3 hidden lg:block">
            <Link href="/app/wallet">
              <div className="p-3 gradient-primary rounded-xl text-white shadow-soft">
                <p className="text-xs font-medium opacity-80">{t.wallet.balance}</p>
                <p className="text-xl font-bold">
                  {"\u20AC"}{((wallet?.balance ?? 0) / 100).toFixed(2)}
                </p>
              </div>
            </Link>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation - White bg, orange active icons */}
      <nav className={cn("fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface border-t border-border/50 safe-area-inset-bottom lg:hidden", hideBottomNav && "hidden")}>
        <div className="flex items-center justify-around h-[4.5rem] px-1">
          {mobileNavItems.map((item) => {
            const active = isActiveRoute(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 min-w-[56px] rounded-xl transition-all duration-200",
                  active
                    ? "text-primary"
                    : "text-[#9A9A9A] active:scale-95"
                )}
              >
                <div className={cn(
                  "relative flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200",
                  active && "bg-primary/15 scale-110"
                )}>
                  <Icon className={cn("h-[22px] w-[22px]", active && "text-primary")} />
                  {item.href === "/app/chat" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-0.5 flex items-center justify-center rounded-full bg-warm text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-medium leading-tight",
                  active ? "text-primary font-semibold" : "text-[#9A9A9A]"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
