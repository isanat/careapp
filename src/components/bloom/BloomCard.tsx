import { ReactNode } from 'react';

interface BloomCardProps {
  children: ReactNode;
  className?: string;
  topBar?: boolean;
  topBarColor?: string;
}

/**
 * Bloom Elements DocCard - Main content wrapper
 * Matches: https://github.com/isanat/bloom-elements/src/components/evyra/EvyraShared.tsx
 * Base: bg-card p-8 rounded-3xl border border-border shadow-card
 * Optional topBar variant for status indicators
 */
export function BloomCard({
  children,
  className = '',
  topBar = false,
  topBarColor = 'bg-primary',
}: BloomCardProps) {
  if (topBar) {
    return (
      <div className={`bg-card rounded-3xl border border-border shadow-card overflow-hidden ${className}`}>
        <div className={`h-1 ${topBarColor}`} />
        <div className="p-8">{children}</div>
      </div>
    );
  }

  return (
    <div className={`bg-card p-8 rounded-3xl border border-border shadow-card relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
