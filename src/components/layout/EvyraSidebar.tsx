'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  IconMenu,
  IconHome,
  IconSearch,
  IconFileText,
  IconMessageSquare,
  IconVideo,
  IconWallet,
  IconSettings,
  IconLogout,
  IconInbox,
  IconBell,
  IconContract,
} from '@/components/icons';
import { cn } from '@/lib/utils';

interface EvyraSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface NavItem {
  id: string;
  href: string;
  icon: React.ElementType;
  label: string;
  count?: string;
  variant?: 'default' | 'danger';
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  active,
  isOpen,
  count,
  variant = 'default'
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  isOpen: boolean;
  count?: string;
  variant?: 'default' | 'danger';
}) => (
  <Link
    href={href}
    className={cn(
      "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 relative group",
      active
        ? "bg-primary text-primary-foreground shadow-md"
        : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
    )}
  >
    <div className="flex items-center gap-3">
      <Icon className={cn(
        "h-5 w-5",
        active ? "text-primary-foreground" : variant === 'danger' ? "text-destructive" : "text-sidebar-foreground group-hover:text-sidebar-primary transition-colors"
      )} />
      {isOpen && (
        <span className={cn(
          "text-sm font-display font-bold tracking-tight",
          active ? "text-primary-foreground" : variant === 'danger' ? "text-destructive" : "text-foreground"
        )}>
          {label}
        </span>
      )}
    </div>
    {isOpen && count && (
      <span className={cn(
        "px-2 py-0.5 rounded-lg text-2xs font-bold font-display",
        active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
      )}>
        {count}
      </span>
    )}
  </Link>
);

const SectionLabel = ({ label, isOpen }: { label: string; isOpen: boolean }) => (
  <div className="pt-6 pb-2 px-3">
    {isOpen ? (
      <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">{label}</p>
    ) : (
      <div className="h-px bg-border mx-auto w-8" />
    )}
  </div>
);

export const EvyraSidebar: React.FC<EvyraSidebarProps> = ({ isOpen, setIsOpen }) => {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Detect user role from session
  const isFamily = session?.user?.role === 'FAMILY';
  const isAdmin = session?.user?.role === 'ADMIN';

  // Dynamic nav items based on user role
  const getNavItems = (): Record<string, NavItem[]> => {
    if (isAdmin) {
      return {
        main: [
          { id: 'dashboard', href: '/app/dashboard', icon: IconHome, label: 'Dashboard' },
          { id: 'demands', href: '/app/demands', icon: IconFileText, label: 'Demandas' },
          { id: 'payments', href: '/app/admin/payments', icon: IconWallet, label: 'Pagamentos' },
        ],
        operations: [
          { id: 'contracts', href: '/app/contracts', icon: IconContract, label: 'Contratos' },
          { id: 'messages', href: '/app/chat', icon: IconMessageSquare, label: 'Mensagens' },
        ],
      };
    }

    if (isFamily) {
      return {
        main: [
          { id: 'dashboard', href: '/app/dashboard', icon: IconHome, label: 'Dashboard' },
          { id: 'demands', href: '/app/family/demands', icon: IconFileText, label: 'Demandas' },
          { id: 'search', href: '/app/search', icon: IconSearch, label: 'Encontrar Cuidador' },
        ],
        operations: [
          { id: 'interviews', href: '/app/interviews', icon: IconVideo, label: 'Entrevistas' },
          { id: 'contracts', href: '/app/contracts', icon: IconContract, label: 'Contratos' },
          { id: 'payments', href: '/app/payments', icon: IconWallet, label: 'Pagamentos' },
        ],
        support: [
          { id: 'messages', href: '/app/chat', icon: IconMessageSquare, label: 'Mensagens' },
          { id: 'notifications', href: '/app/notifications', icon: IconBell, label: 'Notificações' },
        ],
      };
    }

    // Caregiver default
    return {
      main: [
        { id: 'dashboard', href: '/app/dashboard', icon: IconHome, label: 'Dashboard' },
        { id: 'demands', href: '/app/demands', icon: IconSearch, label: 'Demandas' },
        { id: 'proposals', href: '/app/proposals', icon: IconInbox, label: 'Propostas' },
      ],
      operations: [
        { id: 'interviews', href: '/app/interviews', icon: IconVideo, label: 'Entrevistas' },
        { id: 'contracts', href: '/app/contracts', icon: IconContract, label: 'Contratos' },
        { id: 'payments', href: '/app/payments', icon: IconWallet, label: 'Pagamentos' },
      ],
      support: [
          { id: 'messages', href: '/app/chat', icon: IconMessageSquare, label: 'Mensagens' },
        { id: 'notifications', href: '/app/notifications', icon: IconBell, label: 'Notificações' },
      ],
    };
  };

  const navItems = getNavItems();

  // Check if pathname matches or starts with href
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className={cn(
      "fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-all duration-500 ease-in-out flex flex-col",
      isOpen ? 'w-72' : 'w-20'
    )}>
      <div className="flex flex-col h-full p-4">
        {/* Logo with Bloom Elements icons */}
        <div className="flex items-center justify-between mb-8 px-2 pt-2">
          {isOpen ? (
            <h1 className="text-2xl font-display font-black tracking-tighter text-primary flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
                <IconHome className="h-5 w-5 text-primary-foreground" />
              </div>
              EVYRA
            </h1>
          ) : (
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mx-auto shadow-glow">
              <IconHome className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-sidebar-accent rounded-xl transition-colors text-sidebar-foreground lg:hidden">
            <IconMenu className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
          {/* Main Section */}
          {navItems.main && (
            <>
              <SectionLabel label="Menu" isOpen={isOpen} />
              {navItems.main.map(item => (
                <SidebarLink
                  key={item.id}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
                  isOpen={isOpen}
                  count={item.count}
                />
              ))}
            </>
          )}

          {/* Operations Section */}
          {navItems.operations && (
            <>
              <SectionLabel label="Operações" isOpen={isOpen} />
              {navItems.operations.map(item => (
                <SidebarLink
                  key={item.id}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
                  isOpen={isOpen}
                  count={item.count}
                />
              ))}
            </>
          )}

          {/* Support Section */}
          {navItems.support && (
            <>
              <SectionLabel label="Suporte" isOpen={isOpen} />
              {navItems.support.map(item => (
                <SidebarLink
                  key={item.id}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
                  isOpen={isOpen}
                  count={item.count}
                />
              ))}
            </>
          )}
        </nav>

        {/* Settings */}
        <div className="space-y-1 border-t border-border pt-4">
          <SidebarLink
            href="/app/profile"
            icon={IconSettings}
            label="Configurações"
            active={isActive('/app/profile')}
            isOpen={isOpen}
          />
          <SidebarLink
            href="/logout"
            icon={IconLogout}
            label="Sair"
            active={false}
            isOpen={isOpen}
            variant="danger"
          />
        </div>
      </div>
    </aside>
  );
};


export default EvyraSidebar;
