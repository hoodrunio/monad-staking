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
  const formattedPrice = typeof priceUsd === 'number' ? `$${priceUsd.toFixed(2)}` : '$12.48';
  const changeText = priceChangeLabel ?? '+7.2% TODAY';
  const summaryText =
    description ??
    'Participate in securing the Monad ecosystem, earn platform rewards and staking yields.';

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">{tokenSymbol}</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-accent text-balance">{formattedPrice}</span>
            <div className="flex items-center gap-1 text-accent font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>{changeText}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {summaryText}
        </p>
      </div>
    </Card>
  );
}
