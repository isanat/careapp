import { cn } from 'lib/cn';

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  className?: string;
}

export function StatCard({ label, value, trend, className }: StatCardProps) {
  return (
    <div className={cn('rounded-[14px] border border-border/10 bg-surface p-4 shadow-soft', className)}>
      <p className="text-sm text-text2">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-semibold text-text">{value}</span>
        {trend ? <span className="text-sm font-medium text-success">{trend}</span> : null}
      </div>
    </div>
  );
}
