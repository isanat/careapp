import { cn } from 'lib/cn';

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {steps.map((step, index) => {
        const isActive = index + 1 <= currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold',
                isActive ? 'border-primary bg-primary text-white' : 'border-border text-text2'
              )}
            >
              {index + 1}
            </div>
            <span className={cn('text-sm', isActive ? 'text-text' : 'text-text2')}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}
