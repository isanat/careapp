import Link from 'next/link';
import { Home, Search, FileText, Wallet, Settings } from 'lucide-react';

const tabs = [
  { href: '/app', label: 'Dashboard', icon: Home },
  { href: '/app/search', label: 'Search', icon: Search },
  { href: '/app/contracts', label: 'Contracts', icon: FileText },
  { href: '/app/wallet', label: 'Wallet', icon: Wallet },
  { href: '/app/settings', label: 'Settings', icon: Settings }
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-3">
            <img src="/assets/logo.svg" alt="IdosoLink" className="h-8" />
            <span className="font-semibold text-white">IdosoLink</span>
          </Link>
          <Link href="/app/support" className="text-sm text-accent">Suporte</Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 space-y-8">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 bg-card/95 border-t border-white/10 backdrop-blur md:hidden">
        <div className="flex justify-around py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link key={tab.href} href={tab.href} className="flex flex-col items-center text-xs text-slate-200">
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
