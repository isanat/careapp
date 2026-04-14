"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ActionButton {
  id: string;
  label: string;
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

interface BloomActionButtonGroupProps {
  actions: ActionButton[];
  layout?: "horizontal" | "vertical" | "responsive";
  className?: string;
  gap?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  justify?: "start" | "center" | "end" | "between";
}

/**
 * Bloom Action Button Group - Container for grouped action buttons
 * Used for collections of action buttons (save, cancel, delete, etc)
 * Pattern: Flexbox layout with consistent spacing and alignment
 * Responsive: Switches to vertical on mobile with fullWidth option
 */
export function BloomActionButtonGroup({
  actions,
  layout = "responsive",
  className = "",
  gap = "md",
  fullWidth = false,
  justify = "start",
}: BloomActionButtonGroupProps) {
  const gapMap = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  };

  const justifyMap = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  const baseClasses = {
    horizontal: `flex flex-row ${gapMap[gap]} ${justifyMap[justify]}`,
    vertical: `flex flex-col ${gapMap[gap]}`,
    responsive: `flex flex-col sm:flex-row ${gapMap[gap]} ${justifyMap[justify]}`,
  };

  const containerClasses = cn(
    baseClasses[layout],
    fullWidth && layout !== "horizontal" && "w-full",
    fullWidth && layout === "horizontal" && "[&>button]:flex-1",
    fullWidth && layout === "responsive" && "sm:[&>button]:flex-1 w-full sm:w-auto",
    className
  );

  return (
    <div className={containerClasses}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || "default"}
          size={action.size || "default"}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          className={cn(
            fullWidth && layout === "vertical" && "w-full",
            action.className
          )}
        >
          {action.icon && <span className="mr-1">{action.icon}</span>}
          {action.loading ? "..." : action.label}
        </Button>
      ))}
    </div>
  );
}

BloomActionButtonGroup.displayName = "BloomActionButtonGroup";
