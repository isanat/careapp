import { cn } from 'lib/cn';

interface TokenAmountProps {
  tokens: number;
  euro: number;
  className?: string;
}

export function TokenAmount({ tokens, euro, className }: TokenAmountProps) {
  return (
    <div className={cn('flex items-center justify-between rounded-lg border border-border bg-surface p-4', className)}>
      <div>
        <p className="text-sm text-text2">Tokens disponíveis</p>
        <p className="text-2xl font-semibold text-text">{tokens} tokens</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-text2">Equivalente</p>
        <p className="text-xl font-semibold text-primary">€{euro.toFixed(2)}</p>
      </div>
    </div>
  );
}
