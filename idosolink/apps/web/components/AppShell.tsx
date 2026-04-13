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
    <div className="min-h-screen bg-bg pb-28">
      <header className="container-page py-6">
        <div className="bloom-shell flex items-center justify-between px-5 py-4">
          <Link href="/app" className="flex items-center gap-3">
            <img src="/assets/logo.svg" alt="IdosoLink" className="h-10 w-10 rounded-xl" />
            <div>
              <p className="text-lg font-semibold">IdosoLink</p>
              <p className="text-xs text-text2">{role === 'CUIDADOR' ? 'Painel do cuidador' : 'Painel familiar'}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="bloom-chip">Bloom UI</span>
            <Link href="/app/support" className="bloom-chip text-primary">
              Suporte
            </Link>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden bloom-shell flex-col gap-2 p-4 lg:flex">
          {desktopItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/app' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-semibold transition',
                  isActive
                    ? 'bg-gradient-to-r from-primary/15 to-secondary/15 text-primary'
                    : 'text-text2 hover:bg-accent/55 hover:text-text'
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
