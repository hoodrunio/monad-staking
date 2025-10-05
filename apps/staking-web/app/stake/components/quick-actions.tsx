'use client';

import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';
import {
  ChainBreakPixelIcon,
  ChestPixelIcon,
  CoinPixelIcon,
  HourglassPixelIcon,
  SparklePixelIcon,
} from '@/app/components/icons';
import { Badge } from '@/app/components/ui/badge';
import { BalancePieChart } from './balance-pie-chart';
import { usePixelSound } from '@/hooks/usePixelSound';

interface QuickActionsProps {
  readonly stakedValue: string;
  readonly rewardsValue: string;
  readonly availableBalance: string;
  readonly apyLabel: string;
  readonly onStake: () => void;
  readonly onUnstake: () => void;
  readonly onWithdraw: () => void;
  readonly onClaim: () => void;
  readonly onCompound: () => void;
  readonly canStake: boolean;
  readonly canUnstake: boolean;
  readonly canWithdraw: boolean;
  readonly canClaim: boolean;
  readonly canCompound: boolean;
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
  onCompound,
  canStake,
  canUnstake,
  canWithdraw,
  canClaim,
  canCompound,
  busyAction,
  isConnected,
}: QuickActionsProps) {
  const hasStakedTokens = parseAmount(stakedValue) > 0;
  const hasRewards = parseAmount(rewardsValue) > 0;
  const availableAmount = parseAmount(availableBalance);
  const stakedAmount = parseAmount(stakedValue);
  const displayApy = apyLabel === 'Coming soon' ? '0.14%' : apyLabel;
  
  // Enhanced validation
  const hasAvailableBalance = availableAmount > 0;
  const canActuallyStake = canStake && hasAvailableBalance && isConnected;
  const canActuallyUnstake = canUnstake && hasStakedTokens && isConnected;
  const canActuallyClaim = canClaim && hasRewards && isConnected;
  const canActuallyWithdraw = canWithdraw && isConnected;
  const canActuallyCompound = canCompound && hasRewards && isConnected;

  const pieData = [
    { name: 'Available', value: availableAmount, color: '#6cf6ff' },
    { name: 'Staked', value: stakedAmount, color: '#ff5cf4' },
  ].filter(item => item.value >= 0);

  const totalBalance = (availableAmount + stakedAmount).toFixed(2);
  const playSound = usePixelSound();

  const handleStake = () => {
    playSound('coin');
    onStake();
  };

  const handleUnstake = () => {
    playSound('chain');
    onUnstake();
  };

  const handleClaim = () => {
    playSound('chest');
    onClaim();
  };

  const handleCompound = () => {
    playSound('coin');
    onCompound();
  };

  const handleWithdraw = () => {
    playSound('chain');
    onWithdraw();
  };

  return (
    <Card className="h-full space-y-5 px-6 py-6">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center border-2 border-primary bg-[#12092f] shadow-[4px_4px_0_rgba(0,0,0,0.55)]">
            <SparklePixelIcon size={18} className="animate-chest-sparkle text-accent" />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-sm uppercase tracking-[0.14em] text-primary">Action console</span>
            <p className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-base">Stake, unstake, claim, and withdraw in retro style</p>
          </div>
        </div>
        <Badge variant="accent">APY {displayApy}</Badge>
      </header>

      <TooltipProvider>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleStake}
                disabled={!canActuallyStake}
                className={`h-auto min-h-[88px] w-full !flex-col !items-start !justify-start gap-2 overflow-visible whitespace-normal px-4 py-4 text-left ${disabledClass}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-display text-xs uppercase tracking-[0.14em]">Stake MON</span>
                  <CoinPixelIcon size={16} className="animate-coin-drop text-primary" />
                </div>
                <p className="w-full break-words text-xs leading-snug tracking-[0.08em] text-muted-foreground">
                  {busyAction === 'stake' ? 'Opening...' : 'Delegate MON to validators to earn rewards.'}
                </p>
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
                onClick={handleUnstake}
                disabled={!canActuallyUnstake}
                className={`h-auto min-h-[88px] w-full !flex-col !items-start !justify-start gap-2 overflow-visible whitespace-normal px-4 py-4 text-left ${disabledClass}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-display text-xs uppercase tracking-[0.14em]">Unstake</span>
                  <ChainBreakPixelIcon size={16} className="animate-chain-break text-primary" />
                </div>
                <p className="w-full break-words text-xs leading-snug tracking-[0.08em] text-muted-foreground">
                  {busyAction === 'unstake' ? 'Processing...' : 'Queue an undelegation and start cooldown.'}
                </p>
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
                onClick={handleClaim}
                disabled={!canActuallyClaim}
                className={`h-auto min-h-[88px] w-full !flex-col !items-start !justify-start gap-2 overflow-visible whitespace-normal px-4 py-4 text-left ${disabledClass}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-display text-xs uppercase tracking-[0.14em]">Claim rewards</span>
                  <ChestPixelIcon size={16} className="animate-chest-sparkle text-accent" />
                </div>
                <p className="w-full break-words text-xs leading-snug tracking-[0.08em] text-muted-foreground">
                  {busyAction === 'claim' || busyAction === 'claim-all'
                    ? 'Claiming...'
                    : hasRewards
                    ? `${rewardsValue} ready to collect.`
                    : 'Chest sparkles once rewards accrue.'}
                </p>
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
                onClick={handleCompound}
                disabled={!canActuallyCompound}
                className={`h-auto min-h-[88px] w-full !flex-col !items-start !justify-start gap-2 overflow-visible whitespace-normal px-4 py-4 text-left ${disabledClass}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-display text-xs uppercase tracking-[0.14em]">Compound</span>
                  <SparklePixelIcon size={16} className="text-primary" />
                </div>
                <p className="w-full break-words text-xs leading-snug tracking-[0.08em] text-muted-foreground">
                  {busyAction === 'compound'
                    ? 'Compounding...'
                    : hasRewards
                    ? 'Re-stake rewards back into your delegation.'
                    : 'Stake rewards first, then compound to grow faster.'}
                </p>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!isConnected
                ? 'Connect wallet to compound rewards'
                : !canCompound || !hasRewards
                  ? 'No rewards available to compound'
                  : 'Compound rewards into your stake'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleWithdraw}
                disabled={!canActuallyWithdraw}
                className={`h-auto min-h-[88px] w-full !flex-col !items-start !justify-start gap-2 overflow-visible whitespace-normal px-4 py-4 text-left ${disabledClass}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-display text-xs uppercase tracking-[0.14em]">Withdraw</span>
                  <HourglassPixelIcon size={16} className="text-primary" />
                </div>
                <p className="w-full break-words text-xs leading-snug tracking-[0.08em] text-muted-foreground">
                  {busyAction === 'withdraw'
                    ? 'Withdrawing...'
                    : canWithdraw
                    ? 'Collect cooled-down MON from pending withdraws.'
                    : 'Complete cooldown to unlock withdraws.'}
                </p>
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
          title="Balance Distribution"
          description={<span className="font-display text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Total balance: {totalBalance} MON</span>}
        />
      )}

      <div className="flex items-start gap-3 border-2 border-border bg-secondary/40 px-4 py-3 text-sm leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-base">
        <SparklePixelIcon size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>
          {hasStakedTokens
            ? `Current APY ${displayApy} on staked MON. Claim rewards to empty sparkling chests.`
            : 'Stake MON to activate reward chests and begin earning APY.'}
        </span>
      </div>
    </Card>
  );
}
