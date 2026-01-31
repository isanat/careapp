import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from 'lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full font-semibold transition focus-ring disabled:pointer-events-none disabled:opacity-60 shadow-sm',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
        secondary: 'bg-secondary text-white hover:bg-secondary/90 active:bg-secondary/80',
        outline: 'border border-primary/40 text-primary hover:bg-primary/10 active:bg-primary/15',
        ghost: 'text-primary hover:bg-primary/10 active:bg-primary/15'
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-12 px-7 text-lg'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';

  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
