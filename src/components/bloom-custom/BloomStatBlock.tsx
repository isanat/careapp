import React, { ReactNode } from 'react';

interface BloomStatBlockProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  colorClass?: string;
  className?: string;
}

/**
 * Bloom Stat Block - Bloco de estatística
 * Features: Rótulo, valor grande, ícone opcional
 */
export function BloomStatBlock({
  label,
  value,
  icon,
  colorClass = 'text-primary',
  className = '',
}: BloomStatBlockProps) {
  return (
    <div className={`bg-card p-4 rounded-3xl border border-border shadow-card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className={`text-2xl font-display font-bold ${colorClass} mt-2`}>
            {value}
          </p>
        </div>
        {icon && <div className="text-muted-foreground ml-4">{icon}</div>}
      </div>
    </div>
  );
}
