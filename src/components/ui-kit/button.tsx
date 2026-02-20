/**
 * IdosoLink UI Kit - Button Component
 * Health & Care focused design
 * Accessibility: 44px minimum touch target
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles - accessible, friendly
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary - Teal, calm and trustworthy
        primary: 
          "bg-primary text-white shadow-sm hover:bg-primary-dark active:scale-[0.98]",
        
        // Secondary - Lighter teal
        secondary: 
          "bg-secondary text-white shadow-sm hover:bg-primary active:scale-[0.98]",
        
        // Outline - Subtle border
        outline: 
          "border-2 border-primary bg-transparent text-primary hover:bg-primary/5 active:scale-[0.98]",
        
        // Ghost - Minimal, for secondary actions
        ghost: 
          "bg-transparent text-foreground hover:bg-muted active:scale-[0.98]",
        
        // Warm - Gold accent, for special CTAs
        warm: 
          "bg-warm text-foreground shadow-sm hover:bg-warm-light active:scale-[0.98]",
        
        // Success - Soft green
        success: 
          "bg-success text-white shadow-sm hover:bg-success/90 active:scale-[0.98]",
        
        // Danger - Soft red
        danger: 
          "bg-error text-white shadow-sm hover:bg-error/90 active:scale-[0.98]",
        
        // Link - Text only
        link: 
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-11 px-4 py-2 text-sm",
        md: "h-12 px-6 py-3 text-base",
        lg: "h-14 px-8 py-4 text-lg",
        xl: "h-16 px-10 py-5 text-xl",
        icon: "h-12 w-12",
        "icon-sm": "h-10 w-10",
        "icon-lg": "h-14 w-14",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            A carregar...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
