import type { HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes } from 'react';
import { cn } from 'lib/cn';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-md border border-border bg-surface px-4 text-base text-text placeholder:text-text2 focus-ring',
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-semibold text-text', className)} {...props} />;
}

export function HelperText({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-text2', className)} {...props} />;
}

export function ErrorText({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-danger', className)} {...props} />;
}
