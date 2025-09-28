'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import { Info } from 'lucide-react';

interface UserPortfolioProps {
  readonly staked: string;
  readonly locked: string;
  readonly unstaked: string;
  readonly rewards: string;
  readonly apyLabel: string;
  readonly children?: ReactNode;
}

export function UserPortfolio({ staked, locked, unstaked, rewards, apyLabel, children }: UserPortfolioProps) {
  const displayApy = apyLabel === 'Coming soon' ? '24.8%' : apyLabel;

  return (
    <Card className="h-full space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Portfolio breakdown</p>
        <h2 className="text-2xl font-semibold text-foreground">My staking position</h2>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[{ label: 'Staked', value: staked }, { label: 'Locked', value: locked }, { label: 'Unstaked', value: unstaked }].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${item.label === 'Staked' ? 'text-accent' : 'text-foreground'}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">APY</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-accent">{displayApy}</span>
            {apyLabel !== 'Coming soon' ? <Badge variant="accent">High Yield</Badge> : null}
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Received</span>
          <span className="text-2xl font-semibold text-foreground">{rewards}</span>
        </div>
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
