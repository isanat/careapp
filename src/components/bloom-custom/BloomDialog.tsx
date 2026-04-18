import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface BloomDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  iconVariant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showClose?: boolean;
  className?: string;
}

/**
 * Bloom Dialog - Modal component com styling EVYRA
 * Features: Title, description, optional icon, variants
 *
 * Variants:
 * - default: Primary blue icon
 * - success: Green icon (success)
 * - warning: Yellow icon (warning)
 * - error: Red icon (destructive)
 * - info: Cyan icon (info)
 */
export function BloomDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  icon: Icon,
  iconVariant = 'default',
  showClose = true,
  className,
}: BloomDialogProps) {
  const getIconBgClass = () => {
    switch (iconVariant) {
      case 'success':
        return 'bg-success/10';
      case 'warning':
        return 'bg-warning/10';
      case 'error':
        return 'bg-destructive/10';
      case 'info':
        return 'bg-info/10';
      default:
        return 'bg-primary/10';
    }
  };

  const getIconColorClass = () => {
    switch (iconVariant) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-destructive';
      case 'info':
        return 'text-info';
      default:
        return 'text-primary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn(
        'max-w-md p-5 sm:p-6 md:p-8 rounded-3xl bg-card border border-border shadow-elevated',
        className
      )}>
        {/* Icon */}
        {Icon && (
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6',
            getIconBgClass()
          )}>
            <Icon size={32} className={getIconColorClass()} />
          </div>
        )}

        {/* Header */}
        <DialogHeader className="space-y-2 text-center">
          <DialogTitle className="text-2xl font-display font-black text-foreground tracking-tighter uppercase">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground font-medium leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="py-3 sm:py-4 md:py-6">
          {children}
        </div>

        {/* Close button is automatically rendered by DialogContent */}
      </DialogContent>
    </Dialog>
  );
}

// Export Dialog primitives for advanced usage
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
