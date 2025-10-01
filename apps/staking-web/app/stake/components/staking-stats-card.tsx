'use client';

import { HugeiconsIcon, ArrowDownIcon, ArrowUpIcon } from '@/app/components/icons';
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
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {stats.map((stat) => {
        const trendIcon = stat.trend === 'down' ? ArrowDownIcon : ArrowUpIcon;
        const trendColor = stat.trend === 'down' ? 'text-destructive' : 'text-accent';

        return (
          <Card key={stat.label} className="px-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className="flex items-center justify-between">
                <p className="text-balance text-2xl font-bold">{stat.value}</p>
                {stat.change ? (
                  <span className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
                    <HugeiconsIcon icon={trendIcon} size={16} />
                    {stat.change}
                  </span>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
