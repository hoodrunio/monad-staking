'use client';

import type { ReactNode } from 'react';
import { Card } from '@/app/components/ui/card';

interface UserPortfolioProps {
  readonly staked: string;
  readonly withdrawable: string;
  readonly claimable: string;
  readonly unstaked: string;
  readonly apyLabel: string;
  readonly children?: ReactNode;
}

export function UserPortfolio({ staked, withdrawable, claimable, unstaked, apyLabel, children }: UserPortfolioProps) {
  const displayApy = apyLabel === 'Coming soon' ? '24.8%' : apyLabel;
  const stats = [
    { label: 'Staked', value: staked, accent: true },
    { label: 'Withdrawable', value: withdrawable },
    { label: 'Claimable', value: claimable },
    { label: 'Unstaked', value: unstaked },
  ];

  return (
    <Card className="h-full space-y-4 p-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">My staking position</h2>
        <p className="text-xs uppercase tracking-wide text-primary">APY {displayApy}</p>
      </header>

      <div className="grid grid-cols-4 gap-2">
        {stats.map((item) => (
          <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-lg font-semibold ${item.accent ? 'text-accent' : 'text-foreground'}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {children}
    </Card>
  );
}
