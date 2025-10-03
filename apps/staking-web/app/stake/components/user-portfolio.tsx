'use client';

import type { ReactNode } from 'react';
import { Card } from '@/app/components/ui/card';
import { ChestPixelIcon, CoinPixelIcon, ChainBreakPixelIcon, HourglassPixelIcon } from '@/app/components/icons';

interface UserPortfolioProps {
  readonly staked: string;
  readonly withdrawable: string;
  readonly claimable: string;
  readonly unstaked: string;
  readonly children?: ReactNode;
}

function parseAmount(value: string): number {
  const normalized = value.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized || '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

export function UserPortfolio({ staked, withdrawable, claimable, unstaked, children }: UserPortfolioProps) {
  const amounts = {
    staked: parseAmount(staked),
    withdrawable: parseAmount(withdrawable),
    claimable: parseAmount(claimable),
    unstaked: parseAmount(unstaked),
  };

  const total = Object.values(amounts).reduce((sum, value) => sum + value, 0);
  const progress = (value: number) => (total > 0 ? Math.min(Math.max(value / total, 0), 1) : 0);

  const bars = [
    {
      label: 'Staked',
      value: staked,
      icon: CoinPixelIcon,
      tone: 'primary' as const,
      progress: progress(amounts.staked),
    },
    {
      label: 'Withdrawable',
      value: withdrawable,
      icon: ChainBreakPixelIcon,
      tone: 'accent' as const,
      progress: progress(amounts.withdrawable),
    },
    {
      label: 'Claimable',
      value: claimable,
      icon: ChestPixelIcon,
      tone: 'accent' as const,
      progress: progress(amounts.claimable),
    },
    {
      label: 'Unstaked',
      value: unstaked,
      icon: HourglassPixelIcon,
      tone: 'primary' as const,
      progress: progress(amounts.unstaked),
    },
  ];

  return (
    <Card className="h-full space-y-5 px-6 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg uppercase tracking-[0.14em] text-primary">My staking position</h2>
          <p className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-base">Live wallet telemetry</p>
        </div>
      </header>

      <div className="space-y-4">
        {bars.map((bar) => {
          const backgroundImage =
            bar.tone === 'accent'
              ? 'repeating-linear-gradient(90deg, rgba(255, 92, 244, 0.8) 0, rgba(255, 92, 244, 0.8) 12px, rgba(255, 92, 244, 0.3) 12px, rgba(255, 92, 244, 0.3) 16px)'
              : undefined;

          return (
            <div key={bar.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center border-2 border-primary/70 bg-[#12092f] shadow-[3px_3px_0_rgba(0,0,0,0.55)]">
                    <bar.icon size={14} className={bar.tone === 'accent' ? 'text-accent' : 'text-primary'} />
                  </span>
                  <span className="font-display text-xs uppercase tracking-[0.14em] text-muted-foreground">{bar.label}</span>
                </div>
                <span className="font-mono text-sm text-primary">{bar.value}</span>
              </div>
              <div className="h-5 pixel-progress">
                <div
                  className="pixel-progress-fill"
                  style={{ width: `${Math.round(bar.progress * 100)}%`, ...(backgroundImage ? { backgroundImage } : {}) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {children}
    </Card>
  );
}
