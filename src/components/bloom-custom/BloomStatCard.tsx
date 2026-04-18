"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BloomStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
  variant?: "default" | "primary" | "success" | "warning" | "info";
  interactive?: boolean;
}

/**
 * Standardized statistics card component
 * Used for displaying key metrics and analytics
 */
export function BloomStatCard({
  icon,
  label,
  value,
  className = "",
  variant = "default",
  interactive = true,
}: BloomStatCardProps) {
  return (
    <div
      className={cn(
        "bg-card p-5 sm:p-6 md:p-7 rounded-3xl border border-border shadow-card transition-all duration-300",
        interactive && "hover:shadow-elevated hover:-translate-y-1 cursor-pointer group",
        className
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4 transition-transform duration-300",
          interactive && "group-hover:scale-110"
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-1">
        {/* Label */}
        <div className="text-xs font-display font-black text-muted-foreground uppercase tracking-widest">
          {label}
        </div>

        {/* Value */}
        <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none">
          {value}
        </div>
      </div>
    </div>
  );
}

BloomStatCard.displayName = "BloomStatCard";
