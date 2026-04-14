"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  IconHome,
  IconLayoutDashboard,
  IconUsers,
  IconHeartHandshake,
  IconFileText,
  IconCreditCard,
  IconShield,
  IconSettings,
  IconBarChart,
  IconFileSearch,
  IconBell,
  IconHeadphones,
  IconChevronLeft,
  IconChevronRight,
  IconLogout,
} from "@/components/icons";
import { useSession, signOut } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: string; // Key to look up badge from API
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: IconLayoutDashboard },
  { label: "Famílias", href: "/admin/users", icon: IconUsers },
  { label: "Cuidadores", href: "/admin/caregivers", icon: IconHeartHandshake, badgeKey: "pendingCaregivers" },
  { label: "Contratos", href: "/admin/contracts", icon: IconFileText, badgeKey: "pendingContracts" },
  { label: "Pagamentos", href: "/admin/payments", icon: IconCreditCard },
];

const secondaryNavItems: NavItem[] = [
  { label: "Moderação", href: "/admin/moderation", icon: IconShield, badgeKey: "pendingModeration" },
  { label: "Configurações", href: "/admin/settings", icon: IconSettings },
  { label: "Analytics", href: "/admin/analytics", icon: IconBarChart },
  { label: "Logs", href: "/admin/logs", icon: IconFileSearch },
  { label: "Notificações", href: "/admin/notifications", icon: IconBell },
  { label: "Suporte", href: "/admin/support", icon: IconHeadphones, badgeKey: "openSupportTickets" },
];

interface BadgeStats {
  pendingCaregivers: number;
  pendingContracts: number;
  disputedContracts: number;
  pendingKyc: number;
  openSupportTickets: number;
  pendingModeration: number;
}

interface NavContentProps {
  collapsed: boolean;
  onClose: () => void;
  pathname: string;
  userName?: string | null;
  userEmail?: string | null;
  badges: BadgeStats;
  items: NavItem[];
  isSecondary?: boolean;
}

function NavContent({ collapsed, onClose, pathname, userName, userEmail, badges, items, isSecondary = false }: NavContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <IconHome className="h-8 w-8 text-primary" />
          {!collapsed && (
            <span className="font-display font-black text-lg text-foreground">
              Admin
            </span>
          )}
        </Link>
      </div>

      <ScrollArea className="flex-1 py-4">
        {/* Main Navigation */}
        <div className="px-3 py-2">
          {!collapsed && (
            <span className="mb-2 block px-3 text-xs font-semibold uppercase text-slate-500">
              {isSecondary ? "Sistema" : "Principal"}
            </span>
          )}
          <nav className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const badge = item.badgeKey ? badges[item.badgeKey as keyof BadgeStats] || 0 : 0;
              const showBadge = badge > 0;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                    collapsed && "justify-center"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {showBadge && (
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs text-white",
                          isSecondary ? "bg-amber-500" : "bg-cyan-600"
                        )}>
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      {/* User section */}
      <div className="border-t p-4">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            {userName?.charAt(0) || "A"}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                {userName || "Admin"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {userEmail}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sair"
            >
              <IconLogout className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface AdminSidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function AdminSidebar({ open, collapsed, onClose, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [badges, setBadges] = useState<BadgeStats>({
    pendingCaregivers: 0,
    pendingContracts: 0,
    disputedContracts: 0,
    pendingKyc: 0,
    openSupportTickets: 0,
    pendingModeration: 0,
  });

  // Fetch badge stats
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await apiFetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setBadges({
            pendingCaregivers: data.pendingCaregivers || 0,
            pendingContracts: data.pendingContracts || 0,
            disputedContracts: data.disputedContracts || 0,
            pendingKyc: data.pendingKyc || 0,
            openSupportTickets: data.openSupportTickets || 0,
            pendingModeration: data.pendingModeration || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching badge stats:", error);
      }
    };

    fetchBadges();
    
    // Refresh badges every 30 seconds
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-full flex-col">
            <NavContent
              collapsed={false}
              onClose={onClose}
              pathname={pathname}
              userName={session?.user?.name}
              userEmail={session?.user?.email}
              badges={badges}
              items={mainNavItems}
            />
            <div className="px-3 py-2 border-t">
              <span className="mb-2 block px-3 text-xs font-semibold uppercase text-slate-500">
                Sistema
              </span>
              <nav className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  const badge = item.badgeKey ? badges[item.badgeKey as keyof BadgeStats] || 0 : 0;
                  const showBadge = badge > 0;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {showBadge && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r bg-white transition-all duration-300 dark:bg-slate-800 lg:block",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo with collapse button */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <IconHome className="h-8 w-8 text-primary" />
              {!collapsed && (
                <span className="font-display font-black text-lg text-foreground">
                  Admin
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={onToggleCollapse}
            >
              {collapsed ? (
                <IconChevronRight className="h-4 w-4" />
              ) : (
                <IconChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          <ScrollArea className="flex-1 py-4">
            {/* Main Navigation */}
            <div className="px-3 py-2">
              {!collapsed && (
                <span className="mb-2 block px-3 text-xs font-semibold uppercase text-slate-500">
                  Principal
                </span>
              )}
              <nav className="space-y-1">
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  const badge = item.badgeKey ? badges[item.badgeKey as keyof BadgeStats] || 0 : 0;
                  const showBadge = badge > 0;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                        collapsed && "justify-center"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {showBadge && (
                            <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-xs text-white">
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Secondary Navigation */}
            <div className="px-3 py-2 mt-4">
              {!collapsed && (
                <span className="mb-2 block px-3 text-xs font-semibold uppercase text-slate-500">
                  Sistema
                </span>
              )}
              <nav className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  const badge = item.badgeKey ? badges[item.badgeKey as keyof BadgeStats] || 0 : 0;
                  const showBadge = badge > 0;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                        collapsed && "justify-center"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {showBadge && (
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </ScrollArea>

          {/* User section */}
          <div className="border-t p-4">
            <div
              className={cn(
                "flex items-center gap-3",
                collapsed && "justify-center"
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                {session?.user?.name?.charAt(0) || "A"}
              </div>
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    {session?.user?.name || "Admin"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {session?.user?.email}
                  </p>
                </div>
              )}
              {!collapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Sair"
                >
                  <IconLogout className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
