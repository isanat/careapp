import React from 'react';
import { BloomCard } from './BloomCard';
import { cn } from '@/lib/utils';

interface DocCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'interactive' | 'elevated' | 'success' | 'warning' | 'gradient' | 'topBar';
}

/**
 * Doc Card - Card for document/content blocks with optional title and icon
 * Features:
 * - Uses BloomCard as base
 * - Optional title header
 * - Optional icon
 * - Responsive padding
 */
export function DocCard({
  title,
  icon,
  children,
  className,
  variant = 'default',
  ...props
}: DocCardProps) {
  return (
    <BloomCard variant={variant} className={cn('p-5 sm:p-6 md:p-7', className)} {...props}>
      {title && (
        <div className="flex items-center gap-3 mb-4">
          {icon && <div className="text-primary">{icon}</div>}
          <h3 className="text-sm font-display font-bold text-foreground">{title}</h3>
        </div>
      )}
      {children}
    </BloomCard>
  );
}
