import { ReactNode } from 'react';

interface BloomSectionHeaderProps {
  title: string;
  description?: string | ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Bloom Elements section header component
 * Padrão: text-2xl sm:text-3xl md:text-4xl font-display font-black uppercase
 */
export function BloomSectionHeader({
  title,
  description,
  icon,
  action,
  className = '',
}: BloomSectionHeaderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && <div className="h-6 w-6 sm:h-7 sm:w-7">{icon}</div>}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground uppercase">
            {title}
          </h1>
        </div>
        {action && <div>{action}</div>}
      </div>
      {description && (
        <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
