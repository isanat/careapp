import { ReactNode } from 'react';

interface BloomBadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted' | 'secondary' | 'info';
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
  secondary: 'bg-secondary/10 text-secondary',
  info: 'bg-info/10 text-info',
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
