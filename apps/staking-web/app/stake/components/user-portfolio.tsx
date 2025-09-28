'use client';

import type { ReactNode } from 'react';
import { Card } from '@/app/components/ui/card';
import { Info } from 'lucide-react';

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
    <Card className="h-full space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Portfolio breakdown</p>
        <h2 className="text-2xl font-semibold text-foreground">My staking position</h2>
        <p className="text-xs uppercase tracking-wide text-primary">APY {displayApy}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className={`mt-2 text-xl font-semibold ${item.accent ? 'text-accent' : 'text-foreground'}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {children}

      <footer className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Info className="h-4 w-4" />
          Start staking to earn rewards on your MON tokens
        </span>
      </footer>
    </Card>
  );
}
