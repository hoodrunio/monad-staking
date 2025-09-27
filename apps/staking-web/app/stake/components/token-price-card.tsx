'use client';

import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface TokenPriceCardProps {
  readonly tokenSymbol: string;
  readonly priceUsd?: number | null;
  readonly priceChangeLabel?: string;
  readonly description?: string;
}

export function TokenPriceCard({ tokenSymbol, priceUsd, priceChangeLabel, description }: TokenPriceCardProps) {
  const formattedPrice = typeof priceUsd === 'number' ? `$${priceUsd.toFixed(2)}` : '—';
  const changeText = priceChangeLabel ?? 'Live';
  const summaryText =
    description ??
    'Participate in securing the Monad ecosystem, earn platform rewards and staking yields.';

  return (
    <div className="rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{tokenSymbol}</p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-bold text-foreground">{formattedPrice}</span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              <ArrowTrendingUpIcon className="h-4 w-4" />
              {changeText}
            </span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{summaryText}</p>
      </div>
    </div>
  );
}
