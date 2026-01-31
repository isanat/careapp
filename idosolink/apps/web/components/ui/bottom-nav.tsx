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
        'fixed bottom-0 left-0 right-0 z-40 border-t border-border/10 bg-surface/95 backdrop-blur md:hidden',
        className
      )}
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/app' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn('flex flex-col items-center gap-1 text-xs', isActive ? 'text-primary' : 'text-text2')}
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
