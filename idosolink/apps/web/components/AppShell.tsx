'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BottomNav } from './ui/bottom-nav';
import { useAppStore } from '../app/store';
import { cn } from '../lib/cn';
import {
  IconContract,
  IconFamily,
  IconSchedule,
  IconSupport,
  IconWallet
} from './icons';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const role = useAppStore((state) => state.role);
  const desktopItems = [
    { href: '/app', label: 'Dashboard', icon: IconFamily },
    { href: '/app/search', label: role === 'CUIDADOR' ? 'Propostas' : 'Buscar', icon: IconSchedule },
    { href: '/app/contracts', label: 'Contratos', icon: IconContract },
    { href: '/app/wallet', label: 'Carteira', icon: IconWallet },
    { href: '/app/settings', label: 'Ajustes', icon: IconSupport }
  ];

  return (
    <div className="min-h-screen bg-bg pb-24">
      <header className="border-b border-border/10 bg-surface">
        <div className="container-page flex items-center justify-between py-6">
          <Link href="/app" className="flex items-center gap-3">
            <img src="/assets/logo.svg" alt="IdosoLink" className="h-9 w-9" />
            <div>
              <p className="text-lg font-semibold">IdosoLink</p>
              <p className="text-sm text-text2">{role === 'CUIDADOR' ? 'Painel do cuidador' : 'Painel familiar'}</p>
            </div>
          </Link>
          <Link href="/app/support" className="text-sm font-semibold text-primary">
            Suporte humano
          </Link>
        </div>
      </header>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden flex-col gap-2 rounded-[14px] border border-border/10 bg-surface p-4 shadow-soft lg:flex">
          {desktopItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/app' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold transition',
                  isActive ? 'bg-primary/10 text-primary' : 'text-text2 hover:bg-primary/10'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </aside>
        <main className="space-y-8">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
};
