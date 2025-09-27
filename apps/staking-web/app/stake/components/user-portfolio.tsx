
'use client';

import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { TrendingUp, TrendingDown, Wallet, Gift, Info, Zap } from 'lucide-react';

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
  const hasStakedTokens = Number.parseFloat(staked.replace(/[^0-9.]/g, '')) > 0;
  const hasRewards = Number.parseFloat(rewards.replace(/[^0-9.]/g, '')) > 0;

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Quick Actions
          </h2>
          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
            Ready to Stake
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Stake Button */}
            <Button
              onClick={onStake}
              disabled={!canStake}
              className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <TrendingUp className="h-4 w-4" />
              {busyAction === 'stake' ? 'Opening…' : 'Stake MON'}
            </Button>

            {/* Unstake Button */}
            <Button
              variant="outline"
              onClick={onUnstake}
              disabled={!canUnstake}
              className="border-border/50 bg-transparent h-12 flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingDown className="h-4 w-4" />
              {busyAction === 'unstake' ? 'Processing…' : 'Unstake'}
            </Button>

            {/* Claim Button */}
            <Button
              variant="outline"
              onClick={onClaim}
              disabled={!canClaim}
              className="border-border/50 bg-transparent h-12 flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Gift className="h-4 w-4" />
              {busyAction === 'claim' ? 'Claiming…' : 'Claim Rewards'}
            </Button>

            {/* Withdraw Button */}
            <Button
              variant="outline"
              onClick={onWithdraw}
              disabled={!canWithdraw}
              className="border-border/50 bg-transparent h-12 flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="h-4 w-4" />
              {busyAction === 'withdraw' ? 'Withdrawing…' : 'Withdraw'}
            </Button>
          </div>

          {/* Quick Info Section */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                {hasStakedTokens
                  ? `You're currently earning rewards on your staked tokens`
                  : "Start staking to earn rewards on your MON tokens"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Staked</p>
            <p className="text-2xl font-bold text-accent text-balance">{staked}</p>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Locked</p>
            <p className="text-2xl font-bold text-balance">{locked}</p>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Unstaked</p>
            <p className="text-2xl font-bold text-balance">{unstaked}</p>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Rewards</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-accent text-balance">{rewards}</p>
              {hasRewards && (
                <Badge variant="secondary" className="bg-accent/20 text-accent">
                  Available
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">APY</p>
            <p className="text-2xl font-bold text-balance">{apyLabel}</p>
          </div>
        </div>
      </div>

      {/* Start staking message */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Info className="h-4 w-4" />
          Start staking to earn rewards on your MON tokens
        </p>
      </div>
    </div>
  );
}
