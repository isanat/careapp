import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from 'lib/cn';

type AlertVariant = 'default' | 'info' | 'success' | 'warning';

const variants: Record<AlertVariant, string> = {
  default: 'bg-white border-border/10 text-text',
  info: 'bg-accent/45 border-secondary/30 text-text',
  success: 'bg-success/10 border-success/25 text-text',
  warning: 'bg-warning/10 border-warning/25 text-text'
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  variant?: AlertVariant;
}

export function Alert({ className, icon, variant = 'default', ...props }: AlertProps) {
  return (
    <div
      className={cn('flex items-start gap-3 rounded-[16px] border p-4 text-sm', variants[variant], className)}
      role="alert"
      {...props}
    >
      {icon ? <span className="mt-0.5 text-primary">{icon}</span> : null}
      <div>{props.children}</div>
    </div>
  );
}
