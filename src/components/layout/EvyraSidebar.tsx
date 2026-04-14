'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, Briefcase, Home, FileText, MessageSquare, Video, Wallet,
  Settings, LogOut
} from 'lucide-react';
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
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    )}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className={cn(
        active ? "text-primary-foreground" : variant === 'danger' ? "text-destructive" : "text-muted-foreground group-hover:text-primary transition-colors"
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
        "px-2 py-0.5 rounded-lg text-[10px] font-bold font-display",
        active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
      )}>
        {count}
      </span>
    )}
  </Link>
);

const SectionLabel = ({ label, isOpen }: { label: string; isOpen: boolean }) => (
  <div className="pt-6 pb-2 px-3">
    {isOpen ? (
      <p className="text-[10px] font-display font-black text-muted-foreground/50 uppercase tracking-[0.3em]">{label}</p>
    ) : (
      <div className="h-px bg-border mx-auto w-8" />
    )}
  </div>
);

export const EvyraSidebar: React.FC<EvyraSidebarProps> = ({ isOpen, setIsOpen }) => {
  const pathname = usePathname();

  // Detect if it's a family or caregiver user based on URL pattern
  const isFamilyRoute = pathname.includes('/family/');

  const navItems: Record<string, NavItem[]> = {
    main: [
      { id: 'dashboard', href: '/app/dashboard', icon: Home, label: 'Dashboard' },
      isFamilyRoute
        ? { id: 'demands', href: '/app/family/demands', icon: FileText, label: 'Demandas', count: '2' }
        : { id: 'demands', href: '/app/demands', icon: FileText, label: 'Demandas', count: '2' },
      { id: 'messages', href: '/app/chat', icon: MessageSquare, label: 'Mensagens', count: '5' },
    ],
    operations: [
      { id: 'interviews', href: '/app/interviews', icon: Video, label: 'Entrevistas' },
      { id: 'payments', href: '/app/payments', icon: Wallet, label: 'Pagamentos' },
    ],
  };

  // Check if pathname matches or starts with href
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className={cn(
      "fixed top-0 left-0 h-full bg-card border-r border-border z-50 transition-all duration-500 ease-in-out flex flex-col",
      isOpen ? 'w-72' : 'w-20'
    )}>
      <div className="flex flex-col h-full p-4">
        {/* Logo */}
        <div className="flex items-center justify-between mb-8 px-2 pt-2">
          {isOpen ? (
            <h1 className="text-2xl font-display font-black tracking-tighter text-primary flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
                <Briefcase size={18} className="text-primary-foreground" />
              </div>
              EVYRA
            </h1>
          ) : (
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mx-auto shadow-glow">
              <Briefcase size={20} className="text-primary-foreground" />
            </div>
          )}
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground">
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
          {/* Main */}
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

          {/* Operations */}
          <SectionLabel label="Operações" isOpen={isOpen} />
          {navItems.operations.map(item => (
            <SidebarLink
              key={item.id}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
              isOpen={isOpen}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div className="pt-4 border-t border-border space-y-1">
          <Link
            href="/app/profile"
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200",
              isActive('/app/profile')
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Settings size={18} />
              {isOpen && <span className="text-sm font-display font-bold tracking-tight">Definições</span>}
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default EvyraSidebar;
