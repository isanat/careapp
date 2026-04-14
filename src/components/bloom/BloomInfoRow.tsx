"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BloomInfoRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  variant?: "default" | "highlighted" | "muted";
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Bloom Info Row - Key-value pair display for details and information
 * Used for showing structured information like "Cuidador: João Silva"
 * Pattern: Label, Value, optional icon, optional action (edit, delete, etc)
 */
export function BloomInfoRow({
  label,
  value,
  className = "",
  variant = "default",
  icon,
  action,
}: BloomInfoRowProps) {
  const variantClasses = {
    default: "border-b border-border pb-3 last:border-0 last:pb-0",
    highlighted: "bg-primary/5 px-4 py-3 rounded-lg border border-primary/10",
    muted: "opacity-60",
  };

  return (
    <div className={cn("flex items-center justify-between gap-4", variantClasses[variant], className)}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="w-5 h-5 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <label className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest block">
            {label}
          </label>
          <div className="text-sm sm:text-base font-medium text-foreground mt-0.5 truncate">
            {value}
          </div>
        </div>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

BloomInfoRow.displayName = "BloomInfoRow";
