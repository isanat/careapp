/**
 * IdosoLink UI Kit - Alert Component
 * Soft, non-aggressive alerts
 * Health & Care focused
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { IconCheck, IconAlert, IconInfo, IconHelp } from "@/components/icons";

const alertVariants = cva(
  "relative w-full rounded-xl p-5 transition-all duration-200",
  {
    variants: {
      variant: {
        // Info - Soft teal
        info: 
          "bg-[#EEF8F7] border border-secondary-light text-foreground",
        
        // Success - Soft green, calm
        success: 
          "bg-[#F0F9F2] border border-success-light text-foreground",
        
        // Warning - Soft warm, attention but not alarming
        warning: 
          "bg-[#FDF8EE] border border-warm-light text-foreground",
        
        // Error - Soft red, clear but not harsh
        error: 
          "bg-[#FCF4F4] border border-error-light text-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const iconMap = {
  info: IconInfo,
  success: IconCheck,
  warning: IconHelp,
  error: IconAlert,
};

const iconColorMap = {
  info: "text-secondary",
  success: "text-success",
  warning: "text-warm",
  error: "text-error",
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, icon, children, dismissible, onDismiss, ...props }, ref) => {
    const IconComponent = iconMap[variant || "info"];
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, className }))}
        {...props}
      >
        <div className="flex gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            {icon || (
              <IconComponent className={cn("h-6 w-6", iconColorMap[variant || "info"])} />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="font-semibold text-foreground mb-1">{title}</h4>
            )}
            <div className="text-base text-foreground/80 leading-relaxed">
              {children}
            </div>
          </div>
          
          {/* Dismiss button */}
          {dismissible && (
            <button
              type="button"
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
              onClick={onDismiss}
              aria-label="Fechar alerta"
            >
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

export { Alert, alertVariants };
