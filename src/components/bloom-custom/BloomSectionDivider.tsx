import React from 'react';
import { Separator as UISeparator } from '@/components/ui/separator';

interface BloomSectionDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  borderColor?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Bloom Section Divider - Divisor de seções
 * Features: Separador com título opcional
 */
export function BloomSectionDivider({
  title,
  borderColor,
  children,
  className,
  ...props
}: BloomSectionDividerProps) {
  if (title) {
    return (
      <div className={`flex items-center gap-3 my-6 ${className || ''}`} {...props}>
        <UISeparator className="flex-1" />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <UISeparator className="flex-1" />
      </div>
    );
  }

  return <UISeparator className={className} {...props} />;
}
