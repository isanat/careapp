"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconChevronRight, IconHome } from "@/components/icons";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 space-y-2", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-slate-500">
          <Link
            href="/admin/dashboard"
            className="hover:text-slate-700 dark:hover:text-slate-200"
          >
            <IconHome className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1">
              <IconChevronRight className="h-4 w-4" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-900 dark:text-white">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
