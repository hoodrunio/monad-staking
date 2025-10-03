'use client';

import { ChainBreakPixelIcon, SparklePixelIcon } from '@/app/components/icons';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

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
          <Card key={stat.label} className="space-y-4 px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {stat.label}
              </span>
              {stat.change ? <Badge variant="outline">{stat.change}</Badge> : null}
            </div>
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl tracking-[0.04em] text-primary">{stat.value}</p>
              {stat.change ? <TrendIcon size={18} className={`${trendTone} ${stat.trend === 'down' ? 'animate-chain-break' : 'animate-chest-sparkle'}`} /> : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
