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
  className?: string;
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
    default: "bg-card border border-border",
    success: "bg-success/5 border border-success/30",
    warning: "bg-warning/5 border border-warning/30",
    danger: "bg-destructive/5 border border-destructive/30",
  };

  const trendStyles = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground",
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
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">
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
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
