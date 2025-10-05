'use client';

import { ChainBreakPixelIcon, SparklePixelIcon } from '@/app/components/icons';
import { Card } from '@/app/components/ui/card';

interface StatItem {
  readonly label: string;
  readonly value: string;
  readonly change?: string;
  readonly trend?: 'up' | 'down';
}

interface StakingStatsCardProps {
  readonly stats: readonly StatItem[];
}

export function StakingStatsCard({ stats }: StakingStatsCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map((stat) => {
        const TrendIcon = stat.trend === 'down' ? ChainBreakPixelIcon : SparklePixelIcon;
        const trendTone = stat.trend === 'down' ? 'text-destructive' : 'text-accent';

        return (
          <Card key={stat.label} className="!overflow-visible space-y-2 px-4 py-4">
            <div className="flex items-center justify-between gap-1.5">
              <span className="font-display text-[9px] uppercase leading-tight tracking-[0.12em] text-muted-foreground">
                {stat.label}
              </span>
              {stat.change ? <TrendIcon size={12} className={`shrink-0 ${trendTone} ${stat.trend === 'down' ? 'animate-chain-break' : 'animate-chest-sparkle'}`} /> : null}
            </div>
            {stat.change ? (
              <div className="flex items-center">
                <span className="inline-block rounded border border-border/50 bg-transparent px-1.5 py-0.5 font-display text-[8px] uppercase leading-tight tracking-[0.1em] text-foreground/80">
                  {stat.change}
                </span>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between pt-1">
              <p className="w-full break-all font-display text-base leading-tight tracking-[0.02em] text-primary sm:text-lg">{stat.value}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
