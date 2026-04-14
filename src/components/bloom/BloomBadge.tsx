import { ReactNode } from 'react';

interface BloomBadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted' | 'secondary' | 'info';
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border border-primary/30',
  success: 'bg-success/10 text-success border border-success/30',
  warning: 'bg-warning/10 text-warning border border-warning/30',
  destructive: 'bg-destructive/10 text-destructive border border-destructive/30',
  muted: 'bg-muted text-muted-foreground border border-border',
  secondary: 'bg-secondary/10 text-secondary border border-secondary/30',
  info: 'bg-info/10 text-info border border-info/30',
};

/**
 * Bloom Elements Badge - Status and tag indicator
 * Matches: https://github.com/isanat/bloom-elements design patterns
 * Pattern: text-[10px] font-display font-bold rounded-lg uppercase tracking-widest px-3 py-1
 */
export function BloomBadge({
  children,
  variant = 'primary',
  className = '',
}: BloomBadgeProps) {
  return (
    <span
      className={`text-[10px] font-display font-bold rounded-lg uppercase tracking-widest px-3 py-1 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
