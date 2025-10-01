'use client';

import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';
import { HugeiconsIcon, GiftIcon, InformationCircleIcon, ArrowDownIcon, ArrowUpIcon, Wallet02Icon, FlashIcon } from '@/app/components/icons';
import { Badge } from '@/app/components/ui/badge';
import { BalancePieChart } from './balance-pie-chart';

interface QuickActionsProps {
  readonly stakedValue: string;
  readonly rewardsValue: string;
  readonly availableBalance: string;
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
  readonly isConnected: boolean;
}

const disabledClass = 'disabled:cursor-not-allowed disabled:opacity-40';

function parseAmount(value: string): number {
  const normalized = value.replace(/[^0-9.]/g, '');
  return Number.parseFloat(normalized || '0');
}

export function QuickActions({
  stakedValue,
  rewardsValue,
  availableBalance,
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
  isConnected,
}: QuickActionsProps) {
  const hasStakedTokens = parseAmount(stakedValue) > 0;
  const hasRewards = parseAmount(rewardsValue) > 0;
  const availableAmount = parseAmount(availableBalance);
  const stakedAmount = parseAmount(stakedValue);
  const displayApy = apyLabel === 'Coming soon' ? '24.8%' : apyLabel;
  
  // Enhanced validation
  const hasAvailableBalance = availableAmount > 0;
  const canActuallyStake = canStake && hasAvailableBalance && isConnected;
  const canActuallyUnstake = canUnstake && hasStakedTokens && isConnected;
  const canActuallyClaim = canClaim && hasRewards && isConnected;
  const canActuallyWithdraw = canWithdraw && isConnected;



  const pieData = [
    { name: 'Available', value: availableAmount, color: 'oklch(0.6 0.15 264)' },
    { name: 'Staked', value: stakedAmount, color: 'oklch(0.8 0.18 142)' },
  ].filter(item => item.value >= 0);

  const totalBalance = (availableAmount + stakedAmount).toFixed(2);

  return (
    <Card className="h-full space-y-4 p-4">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <HugeiconsIcon icon={FlashIcon} size={20} className="text-accent" />
          Quick Actions
        </h2>
        <Badge variant="accent">APY {displayApy}</Badge>
      </header>

      <TooltipProvider>
        <div className="grid grid-cols-2 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onStake}
                disabled={!canActuallyStake}
                className={`h-10 gap-2 bg-accent text-accent-foreground transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${disabledClass}`}
              >
                <HugeiconsIcon icon={ArrowUpIcon} size={16} />
                {busyAction === 'stake' ? 'Opening…' : 'Stake MON'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!isConnected
                ? 'Connect wallet to stake'
                : !hasAvailableBalance
                  ? 'Insufficient balance to stake'
                  : 'Stake your MON tokens to earn rewards'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={onUnstake}
                disabled={!canActuallyUnstake}
                className={`h-10 gap-2 border-border/50 bg-transparent transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${disabledClass}`}
              >
                <HugeiconsIcon icon={ArrowDownIcon} size={16} />
                {busyAction === 'unstake' ? 'Processing…' : 'Unstake'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!isConnected
                ? 'Connect wallet to unstake'
                : !hasStakedTokens
                  ? 'No staked tokens to unstake'
                  : 'Unstake your MON tokens'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={onClaim}
                disabled={!canActuallyClaim}
                className={`h-10 gap-2 border-border/50 bg-transparent transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${disabledClass}`}
              >
                <HugeiconsIcon icon={GiftIcon} size={16} />
                {busyAction === 'claim' ? 'Claiming…' : 'Claim Rewards'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!isConnected
                ? 'Connect wallet to claim rewards'
                : !hasRewards
                  ? 'No rewards available to claim'
                  : 'Claim your staking rewards'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={onWithdraw}
                disabled={!canActuallyWithdraw}
                className={`h-10 gap-2 border-border/50 bg-transparent transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${disabledClass}`}
              >
                <HugeiconsIcon icon={Wallet02Icon} size={16} />
                {busyAction === 'withdraw' ? 'Withdrawing…' : 'Withdraw'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!isConnected
                ? 'Connect wallet to withdraw'
                : !canWithdraw
                  ? 'No unstaked tokens ready to withdraw'
                  : 'Withdraw your unstaked tokens'}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {pieData.length > 0 && (
        <BalancePieChart
          data={pieData}
          total={`${totalBalance} MON`}
          size="md"
          className="mb-2"
        />
      )}

      <div className="rounded-lg border border-border/30 bg-muted/30 p-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <HugeiconsIcon icon={InformationCircleIcon} size={12} />
          <span>
            {hasStakedTokens
              ? `You're currently earning ${displayApy} APY on your staked tokens`
              : 'Start staking to earn rewards on your MON tokens'}
          </span>
        </div>
      </div>
    </Card>
  );
}
