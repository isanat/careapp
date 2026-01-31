import Link from 'next/link';
import { cn } from 'lib/cn';
import {
  IconContract,
  IconFamily,
  IconSchedule,
  IconSupport,
  IconWallet
} from '../icons';

const items = [
  { href: '/app', label: 'Dashboard', icon: IconFamily },
  { href: '/app/search', label: 'Search', icon: IconSchedule },
  { href: '/app/contracts', label: 'Contracts', icon: IconContract },
  { href: '/app/wallet', label: 'Wallet', icon: IconWallet },
  { href: '/app/settings', label: 'Settings', icon: IconSupport }
];

export function BottomNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden',
        className
      )}
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-1 text-xs text-text2">
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
