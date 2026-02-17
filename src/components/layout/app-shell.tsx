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
  IconLogout,
  IconChevronDown,
} from "@/components/icons";
import { useState, useEffect } from "react";
import { APP_NAME, TOKEN_SYMBOL } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";

interface AppShellProps {
  children: React.ReactNode;
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
        .catch(() => {
          // Silently fail, show default
        });
    }
  }, [session?.user?.id]);

  return wallet;
}

// Navigation links component (defined outside to avoid ESLint error)
function NavLinks({ 
  pathname, 
  items, 
  onClick 
}: { 
  pathname: string; 
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  onClick?: () => void;
}) {
  return (
    <nav className="p-4 space-y-2">
      {items.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== "/app/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
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
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const wallet = useUserWallet();

  const isFamily = session?.user?.role === "FAMILY";

  // Format token balance
  const tokenBalance = wallet?.balance ?? 0;
  const formattedBalance = tokenBalance.toLocaleString("pt-PT", { maximumFractionDigits: 0 });

  const navItems = isFamily
    ? [
        { href: "/app/dashboard", label: t.nav.dashboard, icon: IconHome },
        { href: "/app/search", label: t.nav.searchCaregivers, icon: IconSearch },
        { href: "/app/contracts", label: t.nav.contracts, icon: IconContract },
        { href: "/app/wallet", label: t.nav.wallet, icon: IconWallet },
        { href: "/app/chat", label: t.nav.chat, icon: IconChat },
        { href: "/app/settings", label: t.nav.settings, icon: IconSettings },
      ]
    : [
        { href: "/app/dashboard", label: t.nav.dashboard, icon: IconHome },
        { href: "/app/contracts", label: t.nav.contracts, icon: IconContract },
        { href: "/app/wallet", label: t.nav.wallet, icon: IconWallet },
        { href: "/app/chat", label: t.nav.chat, icon: IconChat },
        { href: "/app/settings", label: t.nav.profile, icon: IconUser },
        { href: "/app/settings", label: t.nav.settings, icon: IconSettings },
      ];

  // Mobile bottom navigation items (limited set)
  const mobileNavItems = isFamily
    ? [
        { href: "/app/dashboard", label: t.nav.dashboard, icon: IconHome },
        { href: "/app/search", label: t.nav.searchCaregivers, icon: IconSearch },
        { href: "/app/chat", label: t.nav.chat, icon: IconChat },
        { href: "/app/settings", label: t.nav.settings, icon: IconSettings },
      ]
    : [
        { href: "/app/dashboard", label: t.nav.dashboard, icon: IconHome },
        { href: "/app/contracts", label: t.nav.contracts, icon: IconContract },
        { href: "/app/chat", label: t.nav.chat, icon: IconChat },
        { href: "/app/settings", label: t.nav.settings, icon: IconSettings },
      ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-top">
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
            <div className="flex items-center gap-2">
              {/* Theme & Language (Desktop) */}
              <div className="hidden md:flex items-center gap-1">
                <ThemeToggle />
                <LanguageSelector />
              </div>

              {/* Token Balance - Dynamic */}
              <Link href="/app/wallet">
                <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5">
                  <IconToken className="h-3.5 w-3.5 text-primary" />
                  <span>{formattedBalance} {TOKEN_SYMBOL}</span>
                </Badge>
              </Link>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <IconBell className="h-5 w-5" />
              </Button>

              {/* User Menu with Logout */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 h-9 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {session?.user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <IconChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/app/dashboard" className="flex items-center">
                      <IconHome className="mr-2 h-4 w-4" />
                      {t.nav.dashboard}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/settings" className="flex items-center">
                      <IconSettings className="mr-2 h-4 w-4" />
                      {t.nav.settings}
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
                    className="text-red-600 dark:text-red-400"
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

      <div className="flex-1 flex pb-16 lg:pb-0">
        {/* Sidebar (Desktop) */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transform transition-transform lg:relative lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "top-16 lg:top-0"
          )}
        >
          <NavLinks pathname={pathname} items={navItems} onClick={() => setSidebarOpen(false)} />

          {/* Role Badge */}
          <div className="absolute bottom-4 left-4 right-4 hidden lg:block">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={isFamily ? "default" : "secondary"}>
                  {isFamily ? t.auth.family : t.auth.caregiver}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isFamily 
                  ? t.dashboard.familyPanel
                  : t.dashboard.caregiverPanel
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

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-bottom lg:hidden">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/app/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[60px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
