import { ReactNode } from 'react';

interface BloomEmptyProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Bloom Empty State - Used in list views with no data
 * Features: Large icon container, bold title, muted description
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
        <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center text-muted-foreground mx-auto mb-4">
          {icon}
        </div>
      )}
      <p className="text-lg font-display font-bold text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
