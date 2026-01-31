import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from 'lib/cn';

type AlertVariant = 'default' | 'info' | 'success' | 'warning';

const variants: Record<AlertVariant, string> = {
  default: 'bg-surface border-border text-text',
  info: 'bg-accent/20 border-accent text-text',
  success: 'bg-success/15 border-success/30 text-text',
  warning: 'bg-warning/15 border-warning/30 text-text'
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  variant?: AlertVariant;
}

export function Alert({ className, icon, variant = 'default', ...props }: AlertProps) {
  return (
    <div
      className={cn('flex items-start gap-3 rounded-lg border p-4 text-sm', variants[variant], className)}
      role="alert"
      {...props}
    >
      {icon ? <span className="mt-0.5 text-primary">{icon}</span> : null}
      <div>{props.children}</div>
    </div>
  );
}
