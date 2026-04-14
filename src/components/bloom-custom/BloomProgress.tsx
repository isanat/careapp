interface BloomProgressProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'info';
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

const variantColors = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
};

/**
 * Bloom Progress Bar - Linear progress indicator
 * Smooth animation with optional label and percentage display
 */
export function BloomProgress({
  value,
  max = 100,
  variant = 'primary',
  label,
  showPercentage = false,
  className = '',
}: BloomProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const fillColor = variantColors[variant];

  return (
    <div className={className}>
      {/* Header with label and percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <p className="text-sm font-medium text-foreground">{label}</p>
          )}
          {showPercentage && (
            <p className="text-sm font-medium text-muted-foreground">{Math.round(percentage)}%</p>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${fillColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
