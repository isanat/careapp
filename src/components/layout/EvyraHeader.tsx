'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  IconSearch,
  IconBell,
  IconSun,
  IconMoon,
  IconUser,
} from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

interface EvyraHeaderProps {
  sidebarOpen: boolean;
}

export const EvyraHeader: React.FC<EvyraHeaderProps> = ({ sidebarOpen }) => {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [unreadCount] = useState(3); // TODO: Replace with actual unread count from API

  return (
    <header className={cn(
      "h-14 md:h-16 border-b border-border bg-card/90 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-6 lg:px-8 flex items-center justify-between"
    )}>
      {/* Left: Search */}
      <div className="flex items-center gap-3 md:gap-6 flex-1">
        <div className="relative w-full max-w-md hidden lg:block">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-full bg-background border border-input rounded-2xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-body text-foreground placeholder:text-muted-foreground/80 shadow-card"
            placeholder="Pesquisar..."
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 md:p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded-xl transition-colors border border-transparent hover:border-border"
          title={`Mudar para ${theme === 'dark' ? 'claro' : 'escuro'}`}
        >
          {theme === 'dark' ? (
            <IconSun className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <IconMoon className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 md:p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded-xl transition-colors border border-transparent hover:border-border">
          <IconBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
          )}
        </button>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-accent rounded-xl transition-colors">
              <Avatar className="h-8 w-8 md:h-10 md:w-10 ring-2 ring-secondary">
                <AvatarFallback>
                  {session?.user?.name?.split(' ')[0][0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-display font-bold text-foreground">
                {session?.user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/app/profile" className="cursor-pointer flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                Perfil
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/api/auth/signout" className="cursor-pointer text-destructive">
                Sair
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default EvyraHeader;
