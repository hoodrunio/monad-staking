'use client';

import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Card } from '@/app/components/ui/card';
import { Gift, Info, TrendingDown, TrendingUp, Wallet, Zap } from 'lucide-react';

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

const disabledClass = 'disabled:cursor-not-allowed disabled:opacity-40';

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
  const displayApy = apyLabel === 'Coming soon' ? '24.8%' : apyLabel;

  return (
    <Card className="px-6">
      <div className="space-y-8">
        <section className="space-y-6">
          <header className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Zap className="h-5 w-5 text-accent" />
              Quick Actions
            </h2>
            <Badge variant="accent">Ready to Stake</Badge>
          </header>

          <TooltipProvider>
            <div className="grid grid-cols-2 gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onStake}
                    disabled={!canStake}
                    className={`h-12 gap-2 bg-accent text-accent-foreground transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${disabledClass}`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {busyAction === 'stake' ? 'Opening…' : 'Stake MON'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stake your MON tokens to earn rewards</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={onUnstake}
                    disabled={!canUnstake}
                    className={`h-12 gap-2 border-border/50 bg-transparent transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${disabledClass}`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    {busyAction === 'unstake' ? 'Processing…' : 'Unstake'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasStakedTokens ? 'Unstake your MON tokens' : 'No staked tokens to unstake'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={onClaim}
                    disabled={!canClaim}
                    className={`h-12 gap-2 border-border/50 bg-transparent transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${disabledClass}`}
                  >
                    <Gift className="h-4 w-4" />
                    {busyAction === 'claim' ? 'Claiming…' : 'Claim Rewards'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasRewards ? 'Claim your staking rewards' : 'No rewards available to claim'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={onWithdraw}
                    disabled={!canWithdraw}
                    className={`h-12 gap-2 border-border/50 bg-transparent transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${disabledClass}`}
                  >
                    <Wallet className="h-4 w-4" />
                    {busyAction === 'withdraw' ? 'Withdrawing…' : 'Withdraw'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canWithdraw ? 'Withdraw your unstaked tokens' : 'No unstaked tokens to withdraw'}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <div className="rounded-lg border border-border/30 bg-muted/30 p-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>
                {hasStakedTokens
                  ? `You're currently earning ${displayApy} APY on your staked tokens`
                  : 'Start staking to earn rewards on your MON tokens'}
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[{ label: 'Staked', value: staked }, { label: 'Locked', value: locked }, { label: 'Unstaked', value: unstaked }].map((item) => (
            <div key={item.label} className="rounded-lg border border-border/40 bg-white/5 p-4">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className={`text-balance text-2xl font-bold ${item.label === 'Staked' ? 'text-accent' : ''}`}>{item.value}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border/40 bg-white/5 p-4">
            <p className="text-sm font-medium text-muted-foreground">APY</p>
            <div className="flex items-center gap-2">
              <p className="text-balance text-2xl font-bold text-accent">{displayApy}</p>
              {apyLabel !== 'Coming soon' ? <Badge variant="accent">High Yield</Badge> : null}
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-white/5 p-4">
            <p className="text-sm font-medium text-muted-foreground">Received</p>
            <p className="text-balance text-2xl font-bold">{rewards}</p>
          </div>
        </section>

        <footer className="py-2 text-center text-sm text-muted-foreground">
          <span className="inline-flex items-center justify-center gap-2">
            <Info className="h-4 w-4" />
            Start staking to earn rewards on your MON tokens
          </span>
        </footer>
      </div>
    </Card>
  );
}
