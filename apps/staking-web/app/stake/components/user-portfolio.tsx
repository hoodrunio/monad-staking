
'use client';

import { Gift, Info, TrendingDown, TrendingUp, Wallet, Zap } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';

interface UserPortfolioProps {
  readonly staked: string;
  readonly locked: string;
  readonly unstaked: string;
  readonly rewards: string;
  readonly apyLabel: string;
  readonly onStake: () => void;
  readonly onUnstake: () => void;
  readonly onWithdraw: () => void;
  readonly onClaim: () => void;
  readonly canStake: boolean;
  readonly canUnstake: boolean;
  readonly canWithdraw: boolean;
  readonly canClaim: boolean;
  readonly busyAction?: string | null;
}

export function UserPortfolio({
  staked,
  locked,
  unstaked,
  rewards,
  apyLabel,
  onStake,
  onUnstake,
  onWithdraw,
  onClaim,
  canStake,
  canUnstake,
  canWithdraw,
  canClaim,
  busyAction,
}: UserPortfolioProps) {
  return (
    <Card className="space-y-8 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Zap className="h-5 w-5 text-accent" />
            Quick actions
          </h2>
          <Badge variant="accent">Ready to stake</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onStake}
            disabled={!canStake}
            variant="accent"
            className="h-12"
          >
            <TrendingUp className="h-4 w-4" />
            {busyAction === 'stake' ? 'Opening…' : 'Stake MON'}
          </Button>
          <Button
            onClick={onUnstake}
            disabled={!canUnstake}
            variant="outline"
            className="h-12"
          >
            <TrendingDown className="h-4 w-4" />
            {busyAction === 'unstake' ? 'Processing…' : 'Unstake'}
          </Button>
          <Button
            onClick={onClaim}
            disabled={!canClaim}
            variant="outline"
            className="h-12"
          >
            <Gift className="h-4 w-4" />
            {busyAction === 'claim' ? 'Claiming…' : 'Claim rewards'}
          </Button>
          <Button
            onClick={onWithdraw}
            disabled={!canWithdraw}
            variant="outline"
            className="h-12"
          >
            <Wallet className="h-4 w-4" />
            {busyAction === 'withdraw' ? 'Withdrawing…' : 'Withdraw'}
          </Button>
        </div>

        <div className="rounded-xl border border-border/40 bg-muted/30 p-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4" />
            <span>Stake MON to earn protocol rewards and participate in validator growth.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PortfolioStat label="Staked" value={staked} tone="accent" />
        <PortfolioStat label="Locked" value={locked} />
        <PortfolioStat label="Unstaked" value={unstaked} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PortfolioStat label="Rewards" value={rewards} tone="accent" />
        <PortfolioStat label="APY" value={apyLabel} />
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        Start staking to earn rewards on your MON tokens
      </p>
    </Card>
  );
}

interface PortfolioStatProps {
  readonly label: string;
  readonly value: string;
  readonly tone?: 'accent';
}

function PortfolioStat({ label, value, tone }: PortfolioStatProps) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone === 'accent' ? 'text-accent' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
