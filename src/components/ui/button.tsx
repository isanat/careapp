import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-bold uppercase tracking-widest rounded-2xl transition-all duration-300 active:scale-[0.97] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:shadow-elevated hover:bg-primary/90",
        dark: "bg-foreground text-background hover:shadow-elevated hover:bg-foreground/90",
        premium:
          "bg-gradient-to-r from-primary to-info text-primary-foreground hover:shadow-elevated",
        secondary:
          "bg-secondary text-foreground hover:bg-secondary/80",
        outline:
          "border-2 border-primary text-primary hover:bg-primary/10",
        ghost:
          "hover:bg-accent text-foreground",
        link: "text-primary underline-offset-4 hover:underline !tracking-normal !font-medium !normal-case",
        destructive:
          "bg-destructive text-destructive-foreground hover:shadow-elevated hover:bg-destructive/90",
        success:
          "bg-success text-success-foreground hover:shadow-elevated hover:bg-success/90",
        warning:
          "bg-warning text-warning-foreground hover:shadow-elevated hover:bg-warning/90",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        default: "h-12 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
        "icon-sm": "h-8 w-8 [&_svg]:size-3.5",
        icon: "h-10 w-10 [&_svg]:size-4",
        "icon-lg": "h-12 w-12 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
