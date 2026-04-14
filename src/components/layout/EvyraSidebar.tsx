'use client';

import React from 'react';
import {
  Menu, Briefcase, Search, FileText, MessageSquare, Users, Wallet,
  BookOpen, Settings, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvyraSidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SidebarLink = ({
  icon: Icon,
  label,
  active,
  onClick,
  isOpen,
  count,
  variant = 'default'
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  isOpen: boolean;
  count?: string;
  variant?: 'default' | 'danger';
}) => (
  <button
    onClick={onClick}
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
  </button>
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

const navItems = {
  main: [
    { id: 'dashboard', icon: Search, label: 'Dashboard' },
    { id: 'demands', icon: FileText, label: 'Demandas', count: '2' },
    { id: 'messages', icon: MessageSquare, label: 'Mensagens', count: '5' },
  ],
  operations: [
    { id: 'interviews', icon: Users, label: 'Entrevistas' },
    { id: 'payments', icon: Wallet, label: 'Pagamentos' },
  ],
  support: [
    { id: 'help', icon: BookOpen, label: 'Centro de Ajuda' },
  ],
};

export const EvyraSidebar: React.FC<EvyraSidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
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
              icon={item.icon}
              label={item.label}
              active={currentView === item.id}
              onClick={() => setCurrentView(item.id)}
              isOpen={isOpen}
              count={item.count}
            />
          ))}

          {/* Operations */}
          <SectionLabel label="Operações" isOpen={isOpen} />
          {navItems.operations.map(item => (
            <SidebarLink
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={currentView === item.id}
              onClick={() => setCurrentView(item.id)}
              isOpen={isOpen}
            />
          ))}

          {/* Support */}
          <SectionLabel label="Suporte" isOpen={isOpen} />
          {navItems.support.map(item => (
            <SidebarLink
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={currentView === item.id}
              onClick={() => setCurrentView(item.id)}
              isOpen={isOpen}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div className="pt-4 border-t border-border space-y-1">
          <SidebarLink icon={Settings} label="Definições" active={false} isOpen={isOpen} />
          <SidebarLink icon={LogOut} label="Sair" active={false} isOpen={isOpen} variant="danger" />
        </div>
      </div>
    </aside>
  );
};

export default EvyraSidebar;
