"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconArrowUp, IconArrowDown } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  trend,
  icon,
  description,
  variant = "default",
  loading = false,
}: StatsCardProps) {
  const variantStyles = {
    default: "bg-white dark:bg-slate-800",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    danger: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };

  const trendStyles = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-slate-500 dark:text-slate-400",
  };

  if (loading) {
    return (
      <Card className={variantStyles[variant]}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(variantStyles[variant], "transition-shadow hover:shadow-md")}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
            {change && (
              <div className={cn("flex items-center gap-1 text-sm", trendStyles[trend || "neutral"])}>
                {trend === "up" && <IconArrowUp className="h-3 w-3" />}
                {trend === "down" && <IconArrowDown className="h-3 w-3" />}
                <span>{change}</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
