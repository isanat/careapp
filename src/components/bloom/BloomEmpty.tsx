import { ReactNode } from 'react';

interface BloomEmptyProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Bloom Elements Empty State - Used in list views with no data
 * Matches: DocCard pattern with centered content
 */
export function BloomEmpty({
  icon,
  title,
  description,
  action,
  className = '',
}: BloomEmptyProps) {
  return (
    <div className={`bg-card p-8 rounded-3xl border border-border shadow-card text-center ${className}`}>
      {icon && (
        <div className="h-8 w-8 text-muted-foreground mx-auto mb-4">
          {icon}
        </div>
      )}
      <p className="text-sm font-display font-bold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
