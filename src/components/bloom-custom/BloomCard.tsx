import React from 'react';
import { Card as UICard } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BloomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  topBar?: boolean;
  topBarColor?: string;
  variant?: 'default' | 'interactive' | 'elevated' | 'success' | 'warning' | 'gradient' | 'topBar';
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

/**
 * Bloom Card - Card wrapper com suporte a múltiplas variantes
 * Variants: default, interactive, elevated, success, warning, gradient, topBar
 *
 * Features:
 * - default: Estilo padrão (shadow-card, border-border)
 * - interactive: Hover effects, cursor pointer (primary/10, primary/50)
 * - elevated: Shadow elevado (shadow-elevated)
 * - success: Green accent (success/30, success/5)
 * - warning: Yellow accent (warning/30, warning/5)
 * - gradient: Gradient background (primary/10 to info/10)
 * - topBar: Barra colorida no topo (mantém compatibilidade)
 */
export function BloomCard({
  topBar,
  topBarColor = 'bg-primary',
  variant = 'default',
  children,
  className,
  ...props
}: BloomCardProps) {
  // Map variant to className combinations
  const getVariantClasses = () => {
    switch (variant) {
      case 'interactive':
        return cn(
          'hover:bg-primary/10 hover:border-primary/50 cursor-pointer transition-all duration-300'
        );
      case 'elevated':
        return cn('shadow-elevated hover:shadow-elevated');
      case 'success':
        return cn(
          'border-2 border-success/30 bg-success/5 shadow-card hover:shadow-elevated transition-all duration-300'
        );
      case 'warning':
        return cn(
          'border-2 border-warning/30 bg-warning/5 shadow-card hover:shadow-elevated transition-all duration-300'
        );
      case 'gradient':
        return cn(
          'bg-gradient-to-br from-primary/10 to-info/10 shadow-card hover:shadow-elevated transition-all duration-300'
        );
      case 'topBar':
        return cn(
          topBar && `border-t-4 ${topBarColor}`,
          'overflow-hidden'
        );
      default:
        // default variant
        return cn('shadow-card hover:shadow-elevated transition-all duration-300');
    }
  };

  return (
    <UICard
      className={cn(
        'overflow-hidden',
        variant !== 'topBar' && variant === 'default' && 'shadow-card',
        variant !== 'topBar' && variant !== 'default' && getVariantClasses(),
        variant === 'topBar' && topBar && `border-t-4 ${topBarColor}`,
        className
      )}
      {...props}
    >
      {children}
    </UICard>
  );
}
