import { ReactNode } from 'react';

interface BloomEmptyProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Bloom Elements empty state component
 * Used when no data is available
 */
export function BloomEmpty({
  icon,
  title,
  description,
  action,
  className = '',
}: BloomEmptyProps) {
  return (
    <div
      className={`py-12 text-center bg-surface rounded-xl border-2 border-dashed border-border/30 ${className}`}
    >
      {icon && (
        <div className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50">{icon}</div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
