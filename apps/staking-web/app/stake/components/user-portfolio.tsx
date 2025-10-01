'use client';

import type { ReactNode } from 'react';
import { Card } from '@/app/components/ui/card';

interface UserPortfolioProps {
  readonly staked: string;
  readonly withdrawable: string;
  readonly claimable: string;
  readonly unstaked: string;
  readonly children?: ReactNode;
}

export function UserPortfolio({ staked, withdrawable, claimable, unstaked, children }: UserPortfolioProps) {
  const stats = [
    { label: 'Staked', value: staked, accent: true },
    { label: 'Withdrawable', value: withdrawable },
    { label: 'Claimable', value: claimable },
    { label: 'Unstaked', value: unstaked },
  ];

  return (
    <Card className="h-full space-y-5 p-5">
      <header className="space-y-1.5">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">My staking position</h2>
      </header>

      <div className="grid grid-cols-4 gap-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-lg p-2.5 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground/70 mb-1.5">{item.label}</p>
            <p className={`text-base font-semibold tracking-tight ${item.accent ? 'text-accent' : 'text-foreground'}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {children}
    </Card>
  );
}
