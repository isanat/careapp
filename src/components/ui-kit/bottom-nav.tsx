/**
 * IdosoLink UI Kit - Bottom Navigation
 * App-style bottom nav for mobile
 * Large touch targets (44px+)
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface BottomNavProps {
  items: NavItem[];
  className?: string;
}

export function BottomNav({ items, className }: BottomNavProps) {
  const pathname = usePathname();
  
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom",
        className
      )}
    >
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full relative",
                  "transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {/* Icon */}
                <div className="relative">
                  <div className={cn(
                    "p-1.5 rounded-xl transition-colors",
                    isActive && "bg-primary/10"
                  )}>
                    {item.icon}
                  </div>
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary text-white text-xs font-semibold rounded-full">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-xs mt-1 font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Safe area padding for iOS devices
export function SafeAreaBottom() {
  return <div className="h-[env(safe-area-inset-bottom)]" />;
}

export default BottomNav;
