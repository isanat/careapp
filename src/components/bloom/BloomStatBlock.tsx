import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BloomStatBlockProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  colorClass?: string;
  className?: string;
}

/**
 * Bloom Elements StatBlock - Stat cards for dashboards
 * Matches: https://github.com/isanat/bloom-elements/src/components/evyra/EvyraShared.tsx
 * Pattern: bg-card p-7 rounded-3xl border border-border shadow-card hover:shadow-elevated
 */
export function BloomStatBlock({
  label,
  value,
  icon,
  colorClass = 'text-primary',
  className = '',
}: BloomStatBlockProps) {
  return (
    <div className={cn(
      'bg-card p-7 rounded-3xl border border-border shadow-card space-y-4 hover:shadow-elevated transition-all group',
      className
    )}>
      {icon && (
        <div className={cn(
          'w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform',
          colorClass
        )}>
          {icon}
        </div>
      )}
      <div>
        <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
          {label}
        </div>
        <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
          {value}
        </div>
      </div>
    </div>
  );
}
