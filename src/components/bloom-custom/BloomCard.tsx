import React from 'react';
import { Card as UICard } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BloomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  topBar?: boolean;
  topBarColor?: string;
  variant?: string; // Para compatibilidade com código existente
  children?: React.ReactNode;
  className?: string;
  [key: string]: any; // Aceitar qualquer prop extra
}

/**
 * Bloom Card - Card wrapper com suporte a customizações
 * Features: Top bar colorido opcional, estilo Bloom
 */
export function BloomCard({
  topBar,
  topBarColor = 'bg-primary',
  variant, // Ignorar prop variant se não for usada
  children,
  className,
  ...props
}: BloomCardProps) {
  return (
    <UICard
      className={cn(
        'overflow-hidden',
        topBar && `border-t-4 ${topBarColor}`,
        className
      )}
      {...props}
    >
      {children}
    </UICard>
  );
}
