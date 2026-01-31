import type { ReactNode } from 'react';
import { cn } from 'lib/cn';

interface ListRowProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function ListRow({ icon, title, subtitle, action, className }: ListRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-soft',
        className
      )}
    >
      {icon ? <div className="text-primary">{icon}</div> : null}
      <div className="flex-1">
        <p className="text-sm font-semibold text-text">{title}</p>
        {subtitle ? <p className="text-xs text-text2">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
