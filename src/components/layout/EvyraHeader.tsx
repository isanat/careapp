'use client';

import React from 'react';
import { Search, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvyraHeaderProps {
  sidebarOpen: boolean;
}

export const EvyraHeader: React.FC<EvyraHeaderProps> = ({ sidebarOpen }) => {
  return (
    <header className={cn(
      "h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between"
    )}>
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full bg-secondary border border-border rounded-2xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body text-foreground placeholder:text-muted-foreground"
            placeholder="Pesquisar por especialidade ou localização..."
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2.5 text-muted-foreground hover:bg-accent rounded-xl relative transition-colors">
          <Activity size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card" />
        </button>
        <div className="w-10 h-10 bg-secondary rounded-xl border-2 border-card shadow-card overflow-hidden ring-2 ring-secondary cursor-pointer">
          <img src="https://i.pravatar.cc/100?u=company" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};

export default EvyraHeader;
