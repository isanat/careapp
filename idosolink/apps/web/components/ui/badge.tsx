import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from 'lib/cn';

const badgeVariants = cva('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', {
  variants: {
    status: {
      success: 'bg-success/15 text-success',
      info: 'bg-secondary/20 text-secondary',
      warning: 'bg-warning/20 text-warning',
      danger: 'bg-danger/15 text-danger',
      neutral: 'bg-border/10 text-text2'
    }
  },
  defaultVariants: {
    status: 'neutral'
  }
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, status, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ status }), className)} {...props} />;
}
