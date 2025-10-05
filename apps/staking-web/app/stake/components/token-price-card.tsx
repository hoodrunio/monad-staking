'use client';

import { CoinPixelIcon, SparklePixelIcon } from '@/app/components/icons';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

interface TokenPriceCardProps {
  readonly tokenSymbol: string;
  readonly priceUsd?: number | null;
  readonly priceChangeLabel?: string;
  readonly description?: string;
}

export function TokenPriceCard({ tokenSymbol, priceUsd, priceChangeLabel, description }: TokenPriceCardProps) {
  const formattedPrice = (() => {
    if (typeof priceUsd !== 'number') return '$0.00';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: priceUsd < 1 ? 4 : 2,
      }).format(priceUsd);
    } catch {
      const decimals = priceUsd < 1 ? 4 : 2;
      return `$${priceUsd.toFixed(decimals)}`;
    }
  })();

  const changeText = priceChangeLabel ?? (typeof priceUsd === 'number' ? 'Live market feed' : 'Price unavailable');
  const summaryText =
    description ?? 'Participate in securing the Monad ecosystem, earn platform rewards and staking yields.';

  return (
    <Card className="relative overflow-hidden px-6 pb-6 pt-5">
      <div className="absolute right-6 top-5 opacity-60">
        <SparklePixelIcon size={22} className="animate-chest-sparkle text-accent" />
      </div>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center border-2 border-primary bg-[#12092f] shadow-[4px_4px_0_rgba(0,0,0,0.55)]">
            <CoinPixelIcon size={20} className="text-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <span className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{tokenSymbol}</span>
            <span className="font-display text-4xl tracking-[0.04em] text-accent">{formattedPrice}</span>
          </div>
        </div>
        <Badge variant="accent">{changeText}</Badge>
      </div>
      <p className="mt-5 text-sm tracking-[0.05em] text-muted-foreground/90 leading-relaxed">{summaryText}</p>
    </Card>
  );
}
