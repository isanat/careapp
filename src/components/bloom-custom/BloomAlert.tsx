import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface BloomAlertProps {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  icon?: ReactNode;
  onClose?: () => void;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const variantStyles = {
  success: {
    container: 'bg-success/5 border-success/20 text-success',
    closeButton: 'hover:bg-success/10',
  },
  error: {
    container: 'bg-destructive/5 border-destructive/20 text-destructive',
    closeButton: 'hover:bg-destructive/10',
  },
  warning: {
    container: 'bg-warning/5 border-warning/20 text-warning',
    closeButton: 'hover:bg-warning/10',
  },
  info: {
    container: 'bg-info/5 border-info/20 text-info',
    closeButton: 'hover:bg-info/10',
  },
};

/**
 * Bloom Alert - Reusable alert banner for feedback
 * Displays success, error, warning, or info messages with optional actions
 */
export function BloomAlert({
  variant,
  title,
  message,
  icon,
  onClose,
  action,
  className = '',
}: BloomAlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`flex items-start gap-4 p-4 sm:p-5 md:p-6 rounded-2xl border ${styles.container} ${className}`}
      role="alert"
    >
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 pt-0.5 text-lg">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-sm mb-1">
          {title}
        </h3>
        <p className="text-sm opacity-90">
          {message}
        </p>

        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-3 text-sm font-medium underline hover:opacity-75 transition-opacity"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 pt-0.5 p-1 rounded-lg transition-colors ${styles.closeButton}`}
          aria-label="Close alert"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
