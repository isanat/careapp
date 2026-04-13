import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from 'lib/cn';

const badgeVariants = cva('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', {
  variants: {
    status: {
      success: 'bg-success/12 text-success border border-success/20',
      info: 'bg-secondary/16 text-primary border border-secondary/30',
      warning: 'bg-warning/14 text-warning border border-warning/30',
      danger: 'bg-danger/12 text-danger border border-danger/25',
      neutral: 'bg-white text-text2 border border-border/15'
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
