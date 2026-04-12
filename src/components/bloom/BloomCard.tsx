import { ReactNode } from 'react';

interface BloomCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Bloom Elements DocCard - Main content wrapper
 * Matches: https://github.com/isanat/bloom-elements/src/components/evyra/EvyraShared.tsx
 * Base: bg-card p-8 rounded-3xl border border-border shadow-card
 */
export function BloomCard({
  children,
  className = '',
}: BloomCardProps) {
  return (
    <div className={`bg-card p-8 rounded-3xl border border-border shadow-card relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
