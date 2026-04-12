import { ReactNode } from 'react';

interface BloomCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  topBar?: boolean;
  topBarColor?: string;
}

/**
 * Base Bloom Elements card component
 * Padrão: rounded-3xl shadow-card border border-border
 * Interactive: shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300
 */
export function BloomCard({
  children,
  className = '',
  interactive = false,
  topBar = false,
  topBarColor = 'bg-primary',
}: BloomCardProps) {
  const baseClasses = 'bg-card rounded-3xl border border-border shadow-card';
  const interactiveClasses = interactive
    ? 'hover:shadow-elevated hover:border-primary/30 transition-all duration-300 cursor-pointer'
    : '';

  if (topBar) {
    return (
      <div className={`${baseClasses} overflow-hidden ${className}`}>
        <div className={`h-1 ${topBarColor}`} />
        <div className="p-5 sm:p-7">{children}</div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} p-5 sm:p-7 ${interactiveClasses} ${className}`}>
      {children}
    </div>
  );
}
