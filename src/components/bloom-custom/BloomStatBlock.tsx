import React, { ReactNode } from 'react';

interface BloomStatBlockProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  iconBg?: string;
  colorClass?: string;
  className?: string;
}

export function BloomStatBlock({
  label,
  value,
  icon,
  iconBg = 'bg-secondary',
  colorClass = 'text-primary',
  className = '',
}: BloomStatBlockProps) {
  return (
    <div className={`bg-card p-5 sm:p-7 rounded-3xl border border-border shadow-card space-y-3 sm:space-y-4 hover:shadow-elevated transition-all group ${className}`}>
      <div>
        {icon && (
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${iconBg} ${colorClass} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
