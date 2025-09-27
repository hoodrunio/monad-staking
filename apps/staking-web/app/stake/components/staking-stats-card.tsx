'use client';

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface StatItem {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
}

interface StakingStatsCardProps {
  readonly stats: readonly StatItem[];
}

export function StakingStatsCard({ stats }: StakingStatsCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-3xl border border-border/50 bg-card/60 p-6 backdrop-blur lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-border/40 bg-card/80 p-4">
          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-2xl font-semibold text-foreground">{stat.value}</span>
            {stat.change ? (
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'down' ? 'text-amber-300' : 'text-primary'
                }`}
              >
                {stat.trend === 'down' ? <ArrowTrendingDownIcon className="h-4 w-4" /> : <ArrowTrendingUpIcon className="h-4 w-4" />}
                {stat.change}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
