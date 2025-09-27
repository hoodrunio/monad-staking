'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-balance">{stat.value}</p>
              {stat.change ? (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-accent' : 'text-destructive'
                  }`}
                >
                  {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stat.change}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
