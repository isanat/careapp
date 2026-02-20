/**
 * IdosoLink UI Kit - Badge Component
 * Status badges with soft colors
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Default - Teal
        default: 
          "bg-primary/10 text-primary",
        
        // Secondary - Lighter teal
        secondary: 
          "bg-secondary/20 text-secondary-dark",
        
        // Success - Soft green
        success: 
          "bg-success-light text-success",
        
        // Warning - Soft warm
        warning: 
          "bg-warning-light text-amber-700",
        
        // Error - Soft red
        error: 
          "bg-error-light text-error",
        
        // Outline - Minimal
        outline: 
          "border border-border bg-transparent text-foreground",
        
        // Warm - Gold accent
        warm: 
          "bg-warm-light text-amber-800",
        
        // Info - Cyan
        info: 
          "bg-accent/30 text-cyan-800",
      },
      size: {
        sm: "px-2 py-0.5 text-xs rounded-md",
        md: "px-3 py-1 text-sm rounded-lg",
        lg: "px-4 py-1.5 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
        {icon && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

// Status Badge - Predefined status styles
const statusConfig = {
  active: { variant: "success" as const, label: "Ativo" },
  pending: { variant: "warning" as const, label: "Pendente" },
  completed: { variant: "success" as const, label: "Concluído" },
  cancelled: { variant: "error" as const, label: "Cancelado" },
  inactive: { variant: "secondary" as const, label: "Inativo" },
  verified: { variant: "success" as const, label: "Verificado" },
  unverified: { variant: "warning" as const, label: "Não Verificado" },
};

type StatusType = keyof typeof statusConfig;

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: StatusType;
  showDot?: boolean;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showDot = true, children, ...props }, ref) => {
    const config = statusConfig[status];
    
    return (
      <Badge
        ref={ref}
        variant={config.variant}
        dot={showDot}
        {...props}
      >
        {children || config.label}
      </Badge>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { Badge, StatusBadge, badgeVariants };
