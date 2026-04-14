"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BloomSectionDividerProps {
  title: string;
  subtitle?: string;
  className?: string;
  borderColor?: "primary" | "success" | "warning" | "destructive" | "info" | "secondary";
}

/**
 * Bloom Section Divider - Styled section header with left accent border
 * Used for dividing content into logical sections with visual hierarchy
 * Pattern: Left colored border (4px), title, optional subtitle
 */
export function BloomSectionDivider({
  title,
  subtitle,
  className = "",
  borderColor = "primary",
}: BloomSectionDividerProps) {
  const borderColorMap = {
    primary: "border-l-primary",
    success: "border-l-success",
    warning: "border-l-warning",
    destructive: "border-l-destructive",
    info: "border-l-info",
    secondary: "border-l-secondary",
  };

  return (
    <div
      className={cn(
        "border-l-4 pl-4 py-2",
        borderColorMap[borderColor],
        className
      )}
    >
      <h2 className="text-lg sm:text-xl md:text-2xl font-display font-black text-foreground uppercase tracking-wide">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs sm:text-sm font-body text-muted-foreground mt-1 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

BloomSectionDivider.displayName = "BloomSectionDivider";
