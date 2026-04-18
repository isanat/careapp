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
 * Features: Ícone no topo, rótulo, valor grande — estilo bloom-elements
 */
export function BloomStatBlock({
    label,
    value,
    icon,
    colorClass,
    className = '',
}: BloomStatBlockProps) {
    return (
          <div className={`bg-card p-5 sm:p-7 rounded-3xl border border-border shadow-card space-y-3 sm:space-y-4 hover:shadow-elevated transition-all group ${className}`}>
            {icon && (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:text-primary transition-colors">
                      {icon}
                    </div>div>
                )}
                <div>
                        <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                          {label}
                        </div>div>
                        <div className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
                          {value}
                        </div>div>
                </div>div>
          </div>div>
        );
}</div>
