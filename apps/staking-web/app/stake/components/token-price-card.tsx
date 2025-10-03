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
  const formattedPrice = typeof priceUsd === 'number' ? `$${priceUsd.toFixed(2)}` : '$12.48';
  const changeText = priceChangeLabel ?? '+7.2% TODAY';
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
            <span className="font-display text-4xl tracking-[0.1em] text-accent">{formattedPrice}</span>
          </div>
        </div>
        <Badge variant="accent">{changeText}</Badge>
      </div>
      <p className="mt-5 text-xs tracking-[0.08em] text-muted-foreground/90">{summaryText}</p>
    </Card>
  );
}
