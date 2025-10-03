'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useAccount } from 'wagmi';
import { MONAD_NETWORK_KEYS } from '@monad-staking/config';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { formatMon } from '@/lib/format';
import { LoadingSkeleton } from '@/app/components/loading-skeleton';
import { ClientOnly } from '@/app/components/client-only';
import { useEpochQuery } from '@/lib/queries';
import { useStakingData } from '@/hooks/useStakingData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ShellSection } from '@/app/components/layout/shell';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  ChainBreakPixelIcon,
  ChestPixelIcon,
  CoinPixelIcon,
  HourglassPixelIcon,
  KnightPixelIcon,
  SparklePixelIcon,
} from '@/app/components/icons';

type PixelIconComponent = (props: { className?: string; size?: number }) => JSX.Element;

interface HudMetricProps {
  readonly icon: PixelIconComponent;
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly animate?: 'coin-drop' | 'chest' | 'chain';
}

function HudMetric({ icon: Icon, label, value, hint, animate }: HudMetricProps) {
  return (
    <div className="flex items-center gap-3 border-2 border-border bg-secondary/60 px-4 py-3 shadow-[4px_4px_0_rgba(0,0,0,0.6)]">
      <span className="flex h-11 w-11 items-center justify-center border-2 border-primary/70 bg-[#11082e] shadow-[3px_3px_0_rgba(0,0,0,0.6)]">
        <Icon
          size={18}
          className={
            animate === 'coin-drop'
              ? 'animate-coin-drop text-primary'
              : animate === 'chest'
              ? 'animate-chest-sparkle text-accent'
              : animate === 'chain'
              ? 'animate-chain-break text-primary'
              : 'text-primary'
          }
        />
      </span>
      <div className="flex flex-col leading-none">
        <span className="font-display text-[10px] tracking-[0.16em] text-muted-foreground">{label}</span>
        <span className="font-display text-xl tracking-[0.08em] text-primary">{value}</span>
        {hint ? <span className="text-sm tracking-[0.06em] text-muted-foreground/80">{hint}</span> : null}
      </div>
    </div>
  );
}

interface MetricCardProps {
  readonly icon: PixelIconComponent;
  readonly label: string;
  readonly value: string;
  readonly description: string;
  readonly progress?: number;
  readonly tone?: 'primary' | 'accent';
  readonly badge?: string;
}

function MetricCard({ icon: Icon, label, value, description, progress = 1, tone = 'primary', badge }: MetricCardProps) {
  const clampedProgress = Math.min(Math.max(progress, 0.08), 1);
  const backgroundImage =
    tone === 'accent'
      ? 'repeating-linear-gradient(90deg, rgba(255, 92, 244, 0.9) 0, rgba(255, 92, 244, 0.9) 12px, rgba(255, 92, 244, 0.35) 12px, rgba(255, 92, 244, 0.35) 16px)'
      : undefined;

  return (
    <Card className="gap-0">
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border-2 border-primary/70 bg-[#12092f] shadow-[3px_3px_0_rgba(0,0,0,0.6)]">
            <Icon size={18} className={tone === 'accent' ? 'text-accent' : 'text-primary'} />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-xs tracking-[0.14em] text-muted-foreground">{label}</span>
            <span className="font-display text-2xl tracking-[0.08em] text-primary">{value}</span>
          </div>
        </div>
        {badge ? <Badge variant="accent">{badge}</Badge> : null}
      </div>
      <CardContent className="pt-5">
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground/80">{description}</p>
        <div className="mt-4 h-6 w-full overflow-hidden pixel-progress">
          <div
            className="pixel-progress-fill"
            style={{ width: `${Math.round(clampedProgress * 100)}%`, ...(backgroundImage ? { backgroundImage } : {}) }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function formatEpochStatus(inDelay: boolean): { label: string; tone: 'primary' | 'accent'; badge?: string } {
  return inDelay
    ? { label: 'Delay period', tone: 'accent', badge: 'Epoch Cooldown' }
    : { label: 'Active', tone: 'primary', badge: 'Validators Live' };
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabledNetworks = useMemo(() => getEnabledNetworkConfigs(configMap), [configMap]);

  const selectedNetwork = getSelectedNetwork(searchParams.get('network'), enabledNetworks);
  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;

  const { address } = useAccount();
  const walletConnected = Boolean(address);

  const { data: epochData, isLoading, error } = useEpochQuery(selectedNetwork || 'monad-mainnet', {
    enabled: Boolean(selectedNetwork && resolved),
  });
  const stakingData = useStakingData(selectedNetwork, Boolean(selectedNetwork && resolved));

  if (enabledNetworks.length === 0) {
    return (
      <ShellSection as="div" className="flex flex-col gap-10">
        <Card className="gap-0">
          <CardHeader className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center border-2 border-primary bg-[#12092f] shadow-[4px_4px_0_rgba(0,0,0,0.6)]">
                <HourglassPixelIcon size={18} className="text-primary" />
              </span>
              <CardTitle className="font-display text-2xl tracking-[0.14em] text-primary">Awaiting network signal</CardTitle>
            </div>
            <CardDescription className="max-w-xl text-sm">
              Add Monad RPC URLs and chain IDs to awaken the staking HUD. Plug in each environment variable to unlock retro telemetry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Required configuration keys
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {MONAD_NETWORK_KEYS.map((key) => (
                <div
                  key={key}
                  className="border-2 border-border bg-secondary/60 px-4 py-3 font-mono text-xs tracking-[0.08em] text-muted-foreground"
                >
                  <span>{key.toUpperCase().replace(/-/g, '_')}_RPC_URL</span>
                  <span>{key.toUpperCase().replace(/-/g, '_')}_CHAIN_ID</span>
                </div>
              ))}
            </div>
            <p className="text-xs tracking-[0.08em] text-muted-foreground">
              Tip: update <code>.env.local</code> then restart <code>pnpm dev --filter apps/staking-web</code> to refresh the pixel grid.
            </p>
          </CardContent>
        </Card>
      </ShellSection>
    );
  }

  if (!selectedNetwork || !resolved) {
    return (
      <ShellSection as="div" className="flex flex-col gap-8">
        <Card>
          <CardHeader className="items-start gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border-2 border-destructive bg-[#2a0b1f] shadow-[3px_3px_0_rgba(0,0,0,0.6)]">
                <ChainBreakPixelIcon size={16} className="text-destructive-foreground" />
              </span>
              <CardTitle className="font-display text-xl text-destructive-foreground">Network not ready</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Selected network is missing configuration. Double-check your environment variables before returning to the arena.
            </CardDescription>
          </CardHeader>
        </Card>
      </ShellSection>
    );
  }

  const status = epochData ? formatEpochStatus(epochData.inEpochDelayPeriod) : null;
  const nextActivationEpoch = epochData
    ? (BigInt(epochData.epoch) + (epochData.inEpochDelayPeriod ? 2n : 1n)).toString()
    : null;
  const withdrawableEpoch = epochData
    ? (BigInt(epochData.epoch) + (epochData.inEpochDelayPeriod ? 2n : 1n) + BigInt(epochData.withdrawalDelay)).toString()
    : null;
  const monPriceDisplay = '$0.00';
  const validatorsCountDisplay = stakingData.validators.length
    ? stakingData.validators.length.toString().padStart(2, '0')
    : stakingData.isLoading.validators
    ? '...'
    : '--';

  const toBigInt = (value?: string | null) => {
    if (!value) return 0n;
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  };

  const toDecimalNumber = (value?: string | null) => {
    if (!value) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const clampProgress = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.min(Math.max(value, 0), 1);
  };

  const networkStakeRaw = stakingData.validators.reduce(
    (acc, validator) => acc + toBigInt(validator.stake.raw),
    0n,
  );
  const totalStakedDisplay =
    stakingData.validators.length > 0
      ? formatMon(networkStakeRaw, 2)
      : stakingData.isLoading.validators
      ? 'Loading...'
      : '-- MON';

  const walletStakedRaw = toBigInt(stakingData.balance?.stakedRaw);
  const walletClaimableRaw = stakingData.delegations.reduce(
    (acc, item) => acc + toBigInt(item.unclaimedRewards.raw),
    0n,
  );
  const walletWithdrawableRaw = stakingData.withdrawals.reduce(
    (acc, item) => acc + toBigInt(item.amount.raw),
    0n,
  );

  const walletStakedDecimal = toDecimalNumber(stakingData.balance?.stakedDecimal);
  const walletAvailableDecimal = toDecimalNumber(stakingData.balance?.decimal);
  const walletClaimableDecimal = stakingData.delegations.reduce(
    (acc, item) => acc + toDecimalNumber(item.unclaimedRewards.decimal),
    0,
  );
  const walletWithdrawableDecimal = stakingData.withdrawals.reduce(
    (acc, item) => acc + toDecimalNumber(item.amount.decimal),
    0,
  );
  const totalPortfolioDecimal =
    walletStakedDecimal + walletAvailableDecimal + walletClaimableDecimal + walletWithdrawableDecimal;

  const barProgress = (value: number) =>
    totalPortfolioDecimal > 0 ? clampProgress(value / totalPortfolioDecimal) : 0;

  const isWalletDataLoading =
    walletConnected &&
    (stakingData.isLoading.delegations ||
      stakingData.isLoading.withdrawals ||
      stakingData.isLoading.balance);

  const walletStakedDisplay = isWalletDataLoading
    ? 'Loading...'
    : stakingData.balance?.stakedFormatted ?? '0 MON';
  const walletAvailableDisplay = isWalletDataLoading
    ? 'Loading...'
    : stakingData.balance?.formatted ?? '0 MON';
  const walletClaimableDisplay = isWalletDataLoading
    ? 'Loading...'
    : walletClaimableRaw > 0n
    ? formatMon(walletClaimableRaw, 3)
    : '0 MON';
  const walletWithdrawableDisplay = isWalletDataLoading
    ? 'Loading...'
    : walletWithdrawableRaw > 0n
    ? formatMon(walletWithdrawableRaw, 3)
    : '0 MON';

  const hasPendingWithdrawals = walletWithdrawableRaw > 0n;
  const hasAnyStake = walletStakedRaw > 0n;

  const epochNumber = epochData ? Number(epochData.epoch) : null;
  const nextActivationNumber = nextActivationEpoch ? Number(nextActivationEpoch) : null;
  const withdrawableNumber = withdrawableEpoch ? Number(withdrawableEpoch) : null;
  const epochLoopProgress = epochNumber !== null && Number.isFinite(epochNumber) ? ((epochNumber % 64) + 1) / 64 : 0.4;
  const epochLengthProgress = epochData ? Math.min(epochData.epochLength / 1600, 1) : 0.5;
  const withdrawalDelayProgress = epochData ? Math.min(Number(epochData.withdrawalDelay ?? 0) / 8, 1) : 0.35;
  const activationCountdown = epochNumber !== null && nextActivationNumber !== null ? nextActivationNumber - epochNumber : null;
  const withdrawalCountdown = epochNumber !== null && withdrawableNumber !== null ? withdrawableNumber - epochNumber : null;
  const activationProgress = activationCountdown !== null ? Math.max(1 - activationCountdown / 3, 0.2) : 0.3;
  const withdrawalProgress = withdrawalCountdown !== null ? Math.max(1 - withdrawalCountdown / 6, 0.2) : 0.4;
  const hudMetrics: HudMetricProps[] = [
    {
      icon: CoinPixelIcon,
      label: 'MON price',
      value: monPriceDisplay,
      hint: 'Retro oracle feed',
      animate: 'coin-drop',
    },
    {
      icon: HourglassPixelIcon,
      label: 'Epoch',
      value: epochData?.epoch ?? '--',
      hint: status?.label ?? 'Awaiting data',
    },
    {
      icon: KnightPixelIcon,
      label: 'Validators',
      value: validatorsCountDisplay,
      hint: walletConnected
        ? `${stakingData.delegations.length.toString().padStart(2, '0')} delegations ready`
        : 'Knights on duty',
    },
    {
      icon: ChestPixelIcon,
      label: 'Total Staked',
      value: totalStakedDisplay,
      hint: walletConnected ? `Your chest: ${walletStakedDisplay}` : 'Treasure secured',
      animate: 'chest',
    },
  ];
  const fallbackBars = [
    { label: 'Total Staked', value: '-- MON', progress: 0.15, tone: 'primary' as const },
    { label: 'Withdrawable', value: '-- MON', progress: 0.08, tone: 'accent' as const },
    { label: 'Claimable', value: '-- MON', progress: 0.05, tone: 'accent' as const },
    { label: 'Available', value: '-- MON', progress: 0.1, tone: 'primary' as const },
  ];
  const stakingBars = walletConnected
    ? [
        { label: 'Total Staked', value: walletStakedDisplay, progress: barProgress(walletStakedDecimal), tone: 'primary' as const },
        { label: 'Withdrawable', value: walletWithdrawableDisplay, progress: barProgress(walletWithdrawableDecimal), tone: 'accent' as const },
        { label: 'Claimable', value: walletClaimableDisplay, progress: barProgress(walletClaimableDecimal), tone: 'accent' as const },
        { label: 'Available', value: walletAvailableDisplay, progress: barProgress(walletAvailableDecimal), tone: 'primary' as const },
      ]
    : fallbackBars;
  const activationTiles = [
    {
      icon: HourglassPixelIcon,
      label: 'Delegations active',
      value: nextActivationEpoch ? `Epoch ${nextActivationEpoch}` : '--',
      description: walletConnected
        ? hasAnyStake
          ? 'Fresh delegations go live once this timer completes.'
          : 'Stake MON to see activation timers in action.'
        : 'Delegations become active after this epoch rolls.',
      progress: activationProgress,
    },
    {
      icon: ChainBreakPixelIcon,
      label: 'Undelegations inactive',
      value: nextActivationEpoch ? `Epoch ${nextActivationEpoch}` : '--',
      description: hasAnyStake
        ? 'Undelegate orders settle once the cooldown flips.'
        : 'No undelegations queued yet.',
      progress: Math.max(activationProgress - 0.1, 0.2),
    },
    {
      icon: ChestPixelIcon,
      label: 'Withdrawals available',
      value: withdrawableEpoch ? `Epoch ${withdrawableEpoch}` : '--',
      description: hasPendingWithdrawals
        ? `${walletWithdrawableDisplay} unlocks when the hourglass empties.`
        : 'Pending Withdraw unlocks when this timer hits zero.',
      progress: withdrawalProgress,
    },
  ];

  return (
    <ShellSection as="div" className="flex flex-col gap-12" width="wide">
      <section className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {hudMetrics.map((metric) => (
            <HudMetric key={metric.label} {...metric} />
          ))}
        </div>
        <Card className="relative gap-0 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-25">
            <div className="hud-grid absolute inset-0" />
          </div>
          <CardHeader className="relative z-10 flex flex-col gap-6 text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <Badge variant="accent">Epoch command center</Badge>
              <Badge variant={walletConnected ? 'secondary' : 'outline'}>
                {walletConnected ? (isWalletDataLoading ? 'Wallet syncing' : 'Wallet linked') : 'Wallet idle'}
              </Badge>
            </div>
            <CardTitle className="font-display text-3xl tracking-[0.12em] text-primary">
              {resolved.label}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm">
              Monitor Epoch cadence, Validators on duty, Delegations queued, Pending Withdraw cooldowns, and Claim Rewards opportunities across {resolved.label}.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 grid gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Chain ID</p>
                  <p className="font-mono text-sm text-primary">{resolved.chainId}</p>
                </div>
                <div>
                  <p className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Epoch length</p>
                  <p className="font-mono text-sm text-primary">{resolved.epochLength.toLocaleString()} blocks</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <span className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Explorer</span>
              {resolved.explorerBaseUrl ? (
                <a
                  href={resolved.explorerBaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-border bg-secondary/60 px-3 py-2 font-display text-[10px] uppercase tracking-[0.14em] text-primary transition hover:border-primary hover:text-accent"
                >
                  Visit explorer
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              ) : (
                <span className="border-2 border-border bg-secondary/40 px-3 py-2 font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Explorer not configured
                </span>
              )}
              <p className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-base">Inspect Validators and Delegations directly in the chain archive.</p>
            </div>
            <div className="flex flex-col justify-between gap-4 border-2 border-border bg-secondary/40 px-4 py-4">
              <div className="space-y-2">
                <span className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Stake command</span>
                <p className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-base">
                  Jump into the stake console to delegate, manage rewards, and queue withdrawals.
                </p>
              </div>
              <Button asChild variant="accent" className="inline-flex items-center justify-between gap-2 px-5 py-3 font-display text-xs uppercase tracking-[0.12em]">
                <Link href="/stake">
                  Go to Stake HQ
                  <CoinPixelIcon size={16} className="animate-coin-drop" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-[0.14em] text-primary">Epoch overview</h2>
            <p className="text-sm tracking-[0.08em] text-muted-foreground/80">Retro telemetry for {resolved.label}.</p>
          </div>
          {status ? <Badge variant="accent">{status.label}</Badge> : null}
        </div>

        {error ? (
          <Card className="border-2 border-destructive bg-secondary/40 text-destructive-foreground shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
            <CardHeader className="gap-4">
              <div className="flex items-center gap-3">
                <ChainBreakPixelIcon size={18} className="animate-chain-break text-destructive" />
                <CardTitle className="font-display text-lg uppercase tracking-[0.14em] text-destructive">Epoch load failed</CardTitle>
              </div>
              <CardDescription className="text-sm tracking-[0.06em] text-destructive-foreground/80">
                {error instanceof Error ? error.message : 'Unknown error occurred while fetching epoch data.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-2 border-border bg-secondary/40 px-5 py-5">
                <CardContent className="space-y-3">
                  <LoadingSkeleton className="h-4 w-24" />
                  <LoadingSkeleton className="h-10 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : epochData ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={HourglassPixelIcon}
              label="Current epoch"
              value={`#${epochData.epoch}`}
              description="Tracking loops of 64 rounds in retro time."
              progress={epochLoopProgress}
            />
            <MetricCard
              icon={SparklePixelIcon}
              label="Epoch status"
              value={status?.label ?? 'Unknown'}
              description="Signals when Delegations or Pending Withdraw are delayed."
              progress={status?.tone === 'accent' ? 0.45 : 0.92}
              tone={status?.tone ?? 'primary'}
              badge={status?.badge}
            />
            <MetricCard
              icon={KnightPixelIcon}
              label="Epoch length"
              value={`${epochData.epochLength.toLocaleString()} blocks`}
              description="Validators march this many blocks before the next Epoch."
              progress={epochLengthProgress}
            />
            <MetricCard
              icon={ChainBreakPixelIcon}
              label="Withdrawal delay"
              value={`${epochData.withdrawalDelay} epochs`}
              description="Cooldown before Pending Withdraw can be claimed."
              progress={withdrawalDelayProgress}
              tone="accent"
            />
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="items-start gap-4">
            <div className="flex items-center gap-3">
              <SparklePixelIcon size={18} className="text-primary" />
              <CardTitle className="font-display text-xl tracking-[0.12em] text-primary">My Staking Position</CardTitle>
            </div>
            <CardDescription className="text-sm leading-relaxed sm:text-base">
              {walletConnected
                ? isWalletDataLoading
                  ? 'Syncing wallet telemetry for Staked, Withdrawable, Claimable, and Unstaked gauges.'
                  : 'Live gauges mirroring your staked, withdrawable, claimable, and unstaked MON balances.'
                : 'Connect your wallet to populate Staked, Withdrawable, Claimable, and Unstaked gauges.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stakingBars.map((bar) => {
              const backgroundImage =
                bar.tone === 'accent'
                  ? 'repeating-linear-gradient(90deg, rgba(255, 92, 244, 0.85) 0, rgba(255, 92, 244, 0.85) 12px, rgba(255, 92, 244, 0.35) 12px, rgba(255, 92, 244, 0.35) 16px)'
                  : undefined;
              return (
                <div key={bar.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs uppercase tracking-[0.14em] text-muted-foreground">{bar.label}</span>
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
            <p className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-base">
              {walletConnected
                ? 'Claim Rewards to empty sparkling chests and watch Pending Withdraw fill as you unstake.'
                : 'Link a wallet to see rewards sparkle and pending withdraw chains populate.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="items-start gap-4">
            <div className="flex items-center gap-3">
              <HourglassPixelIcon size={18} className="text-primary" />
              <CardTitle className="font-display text-xl tracking-[0.12em] text-primary">Activation windows</CardTitle>
            </div>
            <CardDescription className="text-sm leading-relaxed sm:text-base">
              Observe how Delegations, Unstake flows, and Pending Withdraw progress through cooldowns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {epochData ? (
              <div className="grid gap-4">
                {activationTiles.map((tile) => (
                  <div
                    key={tile.label}
                    className="flex flex-col gap-2 border-2 border-border bg-secondary/60 px-4 py-4 shadow-[4px_4px_0_rgba(0,0,0,0.55)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <tile.icon size={16} className="text-primary" />
                        <span className="font-display text-xs uppercase tracking-[0.14em] text-muted-foreground">{tile.label}</span>
                      </div>
                      <span className="font-display text-sm tracking-[0.12em] text-primary">{tile.value}</span>
                    </div>
                    <div className="h-4 pixel-progress">
                      <div
                        className="pixel-progress-fill"
                        style={{ width: `${Math.round(tile.progress * 100)}%` }}
                      />
                    </div>
                    <p className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground/80">{tile.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <LoadingSkeleton className="h-48 w-full" />
            )}
          </CardContent>
        </Card>
      </section>
    </ShellSection>
  );
}

export default function HomePage() {
  return (
    <ClientOnly
      fallback={
        <ShellSection as="div" className="space-y-6">
          <h1 className="text-3xl font-semibold">Monad Staking Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </ShellSection>
      }
    >
      <HomePageContent />
    </ClientOnly>
  );
}
