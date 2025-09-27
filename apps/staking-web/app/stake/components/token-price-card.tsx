'use client';

import { TrendingUp } from 'lucide-react';
import { Card } from '@/app/components/ui/card';

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
    <Card className="gap-4 p-6">
      <div className="space-y-4">
        <div>
          <p className="mb-1 text-sm font-medium text-muted-foreground">{tokenSymbol}</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-accent">{formattedPrice}</span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
              <TrendingUp className="h-4 w-4" />
              {changeText}
            </span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{summaryText}</p>
      </div>
    </Card>
  );
}
