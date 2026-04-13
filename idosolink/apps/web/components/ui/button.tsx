import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from 'lib/cn';

const buttonVariants = cva(
  'button-base disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-primary to-secondary text-white shadow-[0_10px_24px_rgba(79,157,156,0.35)] hover:brightness-105 active:brightness-95',
        secondary:
          'bg-white text-primary border border-primary/25 hover:bg-accent/55 active:bg-accent/75',
        outline: 'bg-transparent text-primary border border-primary/35 hover:bg-primary/8 active:bg-primary/12',
        ghost: 'bg-transparent text-text2 hover:bg-white/70 hover:text-primary active:bg-white'
      },
      size: {
        sm: 'min-h-[40px] px-4 text-sm',
        md: 'min-h-[44px] px-6 text-sm md:text-base',
        lg: 'min-h-[48px] px-7 text-base'
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
