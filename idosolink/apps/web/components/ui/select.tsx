import type { SelectHTMLAttributes } from 'react';
import { cn } from 'lib/cn';

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-md border border-border bg-surface px-4 text-base text-text focus-ring',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
