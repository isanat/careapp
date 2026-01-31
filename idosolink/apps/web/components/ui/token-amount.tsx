import { cn } from 'lib/cn';

interface TokenAmountProps {
  tokens: number;
  euro: number;
  className?: string;
}

export function TokenAmount({ tokens, euro, className }: TokenAmountProps) {
  return (
    <div className={cn('flex items-center justify-between rounded-[14px] border border-border/10 bg-surface p-4', className)}>
      <div>
        <p className="text-sm text-text2">Créditos disponíveis</p>
        <p className="text-2xl font-semibold text-text">{tokens} créditos</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-text2">Equivalente</p>
        <p className="text-xl font-semibold text-primary">€{euro.toFixed(2)}</p>
      </div>
    </div>
  );
}
