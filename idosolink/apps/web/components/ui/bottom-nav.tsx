'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from 'lib/cn';
import {
  IconContract,
  IconFamily,
  IconSchedule,
  IconSupport,
  IconWallet
} from '../icons';
import { useAppStore } from '../../app/store';

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const role = useAppStore((state) => state.role);

  const items = [
    { href: '/app', label: 'Dashboard', icon: IconFamily },
    {
      href: '/app/search',
      label: role === 'CUIDADOR' ? 'Propostas' : 'Buscar',
      icon: IconSchedule
    },
    { href: '/app/contracts', label: 'Contratos', icon: IconContract },
    { href: '/app/wallet', label: 'Carteira', icon: IconWallet },
    { href: '/app/settings', label: 'Ajustes', icon: IconSupport }
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-3 left-3 right-3 z-40 rounded-[24px] border border-white/80 bg-white/92 p-2 shadow-soft backdrop-blur-xl md:hidden',
        className
      )}
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/app' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-[62px] flex-col items-center gap-1 rounded-[14px] px-2 py-2 text-[11px] font-semibold transition',
                isActive ? 'bg-accent/70 text-primary' : 'text-text2 hover:bg-accent/40'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
