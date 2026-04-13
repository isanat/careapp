import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'interactive' | 'elevated' | 'success' | 'warning' | 'error' | 'gradient' | 'topBar' | 'icon-box' | 'stat-box';
type TopBarColor = 'bg-primary' | 'bg-success' | 'bg-warning' | 'bg-destructive' | 'bg-info' | 'bg-secondary';

interface BloomCardProps {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  topBarColor?: TopBarColor;
  icon?: ReactNode;
  title?: string;
  description?: string;
  onClick?: () => void;
  // Legacy props for backward compatibility
  topBar?: boolean;
}

/**
 * Bloom Card - Versatile card component with multiple variants
 * Matches: https://github.com/isanat/bloom-elements/src/components/evyra/EvyraShared.tsx
 *
 * Variants:
 * - default: Simple card with shadow-card
 * - interactive: Card with hover effects and cursor pointer
 * - elevated: Always with shadow-elevated
 * - success: Green accent with success colors
 * - warning: Yellow accent with warning colors
 * - error: Red accent with destructive colors
 * - gradient: Gradient background from primary to info
 * - topBar: Colored bar at the top
 * - icon-box: Large icon container with small content
 * - stat-box: Centered layout for statistics (icon, value, label)
 */
export function BloomCard({
  children,
  className = '',
  variant = 'default',
  topBarColor = 'bg-primary',
  icon,
  title,
  description,
  onClick,
  topBar = false,
}: BloomCardProps) {
  // Handle legacy topBar prop
  const finalVariant = topBar ? 'topBar' : variant;

  const baseClasses = 'bg-card rounded-3xl border border-border p-5 sm:p-7';

  const variantClasses: Record<CardVariant, string> = {
    default: 'shadow-card',
    interactive: 'shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300 cursor-pointer',
    elevated: 'shadow-elevated',
    success: 'bg-success/5 border-success/20 shadow-card',
    warning: 'bg-warning/5 border-warning/20 shadow-card',
    error: 'bg-destructive/5 border-destructive/20 shadow-card',
    gradient: 'bg-gradient-to-br from-primary/10 to-info/10 shadow-card',
    topBar: 'shadow-card overflow-hidden',
    'icon-box': 'shadow-card flex flex-col items-center justify-center gap-4',
    'stat-box': 'shadow-card flex flex-col items-center justify-center gap-3',
  };

  // TopBar variant with special structure
  if (finalVariant === 'topBar') {
    return (
      <div className={cn(baseClasses, variantClasses.topBar, className)}>
        <div className={cn('h-1 rounded-t-3xl', topBarColor)} />
        <div className="p-4">
          {title && <h3 className="font-display font-bold text-foreground mb-2">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
          {children}
        </div>
      </div>
    );
  }

  // Icon-box variant with larger icon container
  if (variant === 'icon-box') {
    return (
      <div
        className={cn(baseClasses, variantClasses['icon-box'], className)}
        onClick={onClick}
      >
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
        {title && <h3 className="font-display font-bold text-foreground text-center">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground text-center">{description}</p>}
        {children}
      </div>
    );
  }

  // Stat-box variant with centered layout
  if (variant === 'stat-box') {
    return (
      <div className={cn(baseClasses, variantClasses['stat-box'], className)}>
        {icon && (
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl">
            {icon}
          </div>
        )}
        <div className="text-center">
          <div className="text-4xl font-display font-black text-foreground leading-none">
            {title}
          </div>
          {description && (
            <p className="text-xs font-display font-black text-muted-foreground uppercase tracking-widest mt-2">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    );
  }

  // All other variants (default, interactive, elevated, success, warning, error, gradient)
  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={onClick}
    >
      {title && <h3 className="font-display font-bold text-foreground mb-2">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {children}
    </div>
  );
}
