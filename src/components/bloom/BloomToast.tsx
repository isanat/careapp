'use client';

import { Toaster, toast as sonnerToast } from 'sonner';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface BloomToastProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'bg-success/10 border-success/30 text-success',
  error: 'bg-destructive/10 border-destructive/30 text-destructive',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  info: 'bg-info/10 border-info/30 text-info',
};

/**
 * Show a Bloom-styled toast notification
 */
export function showBloomToast({
  variant = 'info',
  message,
  description,
  action,
  duration = 4000,
}: BloomToastProps) {
  const Icon = toastIcons[variant];

  return sonnerToast.custom(
    (toastId) => (
      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${toastStyles[variant]} backdrop-blur-sm`}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-display font-bold text-sm">{message}</p>
          {description && <p className="text-sm opacity-90 mt-1">{description}</p>}
        </div>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              sonnerToast.dismiss(toastId);
            }}
            className="text-sm font-medium underline hover:opacity-75 transition-opacity"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={() => sonnerToast.dismiss(toastId)}
          className="flex-shrink-0 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ),
    { duration }
  );
}

/**
 * Bloom Toast Provider - Add to root layout
 */
export function BloomToastProvider() {
  return (
    <Toaster
      position="top-right"
      theme="system"
      closeButton
    />
  );
}

/**
 * Convenience exports for common toast patterns
 */
export const bloomToast = {
  success: (message: string, options?: Partial<BloomToastProps>) =>
    showBloomToast({ ...options, variant: 'success', message }),
  error: (message: string, options?: Partial<BloomToastProps>) =>
    showBloomToast({ ...options, variant: 'error', message }),
  warning: (message: string, options?: Partial<BloomToastProps>) =>
    showBloomToast({ ...options, variant: 'warning', message }),
  info: (message: string, options?: Partial<BloomToastProps>) =>
    showBloomToast({ ...options, variant: 'info', message }),
};
