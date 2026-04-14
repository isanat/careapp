import React from 'react';
import { Badge as UIBadge } from '@/components/ui/badge';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'muted' | 'success' | 'warning' | 'info' | 'primary' | null;

interface BloomBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Bloom Badge - Badge wrapper com suporte a variantes customizadas
 * Features: Mapeia variantes Bloom para UI Badge variants
 */
export function BloomBadge({
  variant = 'default',
  children,
  className,
  ...props
}: BloomBadgeProps) {
  // Mapear variantes customizadas para as que existem no Badge
  const mappedVariant = (() => {
    if (!variant) return undefined;
    switch (variant) {
      case 'primary':
      case 'default':
        return 'default';
      case 'secondary':
        return 'secondary';
      case 'destructive':
        return 'destructive';
      case 'warning':
        return 'destructive'; // Mapear warning para destructive (vermelho)
      case 'success':
        return 'secondary'; // Mapear success para secondary
      case 'info':
        return 'secondary'; // Mapear info para secondary
      case 'muted':
        return 'outline'; // Mapear muted para outline
      case 'outline':
        return 'outline';
      default:
        return 'default';
    }
  })();

  return (
    <UIBadge variant={mappedVariant} className={className} {...props}>
      {children}
    </UIBadge>
  );
}
