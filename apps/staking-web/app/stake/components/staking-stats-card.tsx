'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/app/components/ui/card';

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
    <Card className="gap-6 p-6">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-semibold text-foreground">{stat.value}</span>
              {stat.change ? (
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'down' ? 'text-destructive' : 'text-accent'
                  }`}
                >
                  {stat.trend === 'down' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  {stat.change}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
