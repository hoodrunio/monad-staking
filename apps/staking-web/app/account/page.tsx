'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import {
  ChainBreakPixelIcon,
  ChestPixelIcon,
  CoinPixelIcon,
  HourglassPixelIcon,
  KnightPixelIcon,
} from '@/app/components/icons';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { formatDelegationRow, formatWithdrawalRow } from '@/lib/account-utils';
import { ClientOnly } from '@/app/components/client-only';
import { LoadingSkeleton } from '@/app/components/loading-skeleton';
import { useDelegationsQuery, useWithdrawalsQuery, useEpochQuery, useValidatorsQuery } from '@/lib/queries';
import { formatMonFromWei } from '@/lib/utils';
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ShellSection } from '@/app/components/layout/shell';
import { Badge } from '@/app/components/ui/badge';

function AccountPageContent() {
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabledNetworks = getEnabledNetworkConfigs(configMap);

  const networkParam = searchParams.get('network');
  const selectedNetwork = getSelectedNetwork(networkParam, enabledNetworks);
  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;

  const { data: epochData } = useEpochQuery(selectedNetwork || 'monad-mainnet', {
    enabled: !!selectedNetwork && !!resolved
  });
  const { data: validators } = useValidatorsQuery(selectedNetwork || 'monad-mainnet', '', 300, {
    enabled: !!selectedNetwork && !!resolved && !!address
  });
  const { data: delegations, isLoading: delegationsLoading, error: delegationsError } = 
    useDelegationsQuery(selectedNetwork || 'monad-mainnet', address || '', '0', {
      enabled: !!selectedNetwork && !!resolved && !!address
    });
  const { data: withdrawals, isLoading: withdrawalsLoading, error: withdrawalsError } = 
    useWithdrawalsQuery(selectedNetwork || 'monad-mainnet', address || '', undefined, {
      enabled: !!selectedNetwork && !!resolved && !!address
    });

  const validatorMap = useMemo(() => {
    const map = new Map<string, { name: string | undefined; isActive: boolean }>();
    validators?.items.forEach((v) => {
      map.set(v.validatorId, { name: v.meta?.name, isActive: v.isActive ?? false });
    });
    return map;
  }, [validators]);

  if (!selectedNetwork || !resolved) {
    return (
      <ShellSection width="default">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">My Account</CardTitle>
            <CardDescription>Network not configured.</CardDescription>
          </CardHeader>
        </Card>
      </ShellSection>
    );
  }

  if (!address) {
    return (
      <ShellSection as="div" className="space-y-6" width="wide">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-[0.14em] text-primary">My Account</h1>
          <p className="mt-1 text-[11px] tracking-[0.12em] text-muted-foreground/80">Connect wallet to view positions</p>
        </div>
        <div className="flex items-center justify-center border-2 border-border bg-secondary/40 p-12 text-center shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center gap-3">
            <CoinPixelIcon size={28} className="animate-coin-drop text-primary" />
            <p className="font-display text-sm uppercase tracking-[0.12em] text-muted-foreground">Wallet required</p>
            <p className="text-[11px] tracking-[0.12em] text-muted-foreground/80">Connect to sync staking telemetry</p>
          </div>
        </div>
      </ShellSection>
    );
  }

  const currentEpoch = epochData ? BigInt(epochData.epoch) : 0n;
  const totalStaked = delegations?.items.reduce((sum, d) => sum + Number(d.stake.decimal || 0), 0) || 0;
  const totalRewards = delegations?.items.reduce((sum, d) => sum + Number(d.unclaimedRewards.decimal || 0), 0) || 0;
  const readyWithdrawals = withdrawals?.items.filter((w) => BigInt(w.withdrawEpoch) < currentEpoch) || [];

  return (
    <ShellSection as="div" className="space-y-6" width="wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center border-2 border-primary bg-[#12092f] shadow-[4px_4px_0_rgba(0,0,0,0.55)]">
            <KnightPixelIcon size={20} className="text-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl uppercase tracking-[0.14em] text-primary">My Account</h1>
            <span className="font-mono text-xs text-muted-foreground/70">{address}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="accent">{resolved.label}</Badge>
          <div className="flex items-center gap-2">
            <CoinPixelIcon size={14} className="text-primary" />
            <span className="font-display text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Staked</span>
            <span className="font-mono text-sm text-primary">{totalStaked.toFixed(2)} MON</span>
          </div>
          <div className="flex items-center gap-2">
            <ChestPixelIcon size={14} className="animate-chest-sparkle text-accent" />
            <span className="font-display text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Rewards</span>
            <span className="font-mono text-sm text-accent">{totalRewards.toFixed(4)} MON</span>
          </div>
          <div className="flex items-center gap-2">
            <HourglassPixelIcon size={14} className="text-primary" />
            <span className="font-display text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Pending</span>
            <span className="font-mono text-sm text-foreground">{withdrawals?.items.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-sm uppercase tracking-[0.14em] text-primary">Delegations</h2>
            <span className="font-display text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {delegations?.items.length || 0} active
            </span>
          </div>

          {delegationsError ? (
            <div className="flex items-center gap-3 border-2 border-destructive bg-secondary/40 p-4 font-display text-xs uppercase tracking-[0.12em] text-destructive shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
              <ChainBreakPixelIcon size={14} className="text-destructive" />
              <span>Failed to load delegations</span>
            </div>
          ) : delegationsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : delegations && delegations.items.length > 0 ? (
            <div className="space-y-2">
              {delegations.items.map((delegation) => {
                const formatted = formatDelegationRow(delegation);
                const hasPending = formatted.pendingChanges.deltaStake !== '0' || formatted.pendingChanges.nextDeltaStake !== '0';
                const validatorInfo = validatorMap.get(formatted.validatorId);
                const displayName = validatorInfo?.name ?? `Validator ${formatted.validatorId}`;

                return (
                  <div
                    key={formatted.validatorId}
                    className="border-2 border-border bg-secondary/40 p-4 shadow-[4px_4px_0_rgba(0,0,0,0.5)]"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center border-2 border-primary bg-[#12092f] shadow-[3px_3px_0_rgba(0,0,0,0.55)]">
                          <KnightPixelIcon size={14} className="text-primary" />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-display text-sm uppercase tracking-[0.12em] text-primary">{displayName}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">#{formatted.validatorId}</span>
                        </div>
                        {hasPending ? <Badge variant="accent">Pending</Badge> : null}
                      </div>
                      <span className="font-mono text-sm text-primary">{formatted.stake}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] tracking-[0.1em] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ChestPixelIcon size={12} className="text-accent" />
                        Rewards <span className="font-mono text-accent">{formatted.unclaimedRewards}</span>
                      </span>
                      {formatted.pendingChanges.deltaStake !== '0' && (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <ChainBreakPixelIcon size={12} className="text-amber-300" />
                          {formatMonFromWei(formatted.pendingChanges.deltaStake)} (E{formatted.pendingChanges.deltaEpoch})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center border-2 border-dashed border-border bg-secondary/30 p-8 text-center">
              <div className="space-y-1">
                <p className="font-display text-xs uppercase tracking-[0.12em] text-muted-foreground">No delegations</p>
                <p className="text-[11px] tracking-[0.12em] text-muted-foreground/70">Stake MON to begin earning rewards</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-sm uppercase tracking-[0.14em] text-primary">Withdrawals</h2>
            <span className="font-display text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {readyWithdrawals.length > 0 ? `${readyWithdrawals.length} ready` : 'None ready'}
            </span>
          </div>

          {withdrawalsError ? (
            <div className="flex items-center gap-3 border-2 border-destructive bg-secondary/40 p-4 font-display text-xs uppercase tracking-[0.12em] text-destructive shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
              <ChainBreakPixelIcon size={14} className="text-destructive" />
              <span>Failed to load withdrawals</span>
            </div>
          ) : withdrawalsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : withdrawals && withdrawals.items.length > 0 ? (
            <div className="space-y-2">
              {withdrawals.items.map((withdrawal) => {
                const formatted = formatWithdrawalRow(withdrawal);
                const canWithdraw = formatted.canWithdraw(currentEpoch);
                const validatorInfo = validatorMap.get(formatted.validatorId);
                const displayName = validatorInfo?.name ?? `Validator ${formatted.validatorId}`;

                return (
                  <div
                    key={`${formatted.validatorId}-${formatted.withdrawalId}`}
                    className="border-2 border-border bg-secondary/35 p-4 shadow-[4px_4px_0_rgba(0,0,0,0.5)]"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center border-2 border-primary bg-[#12092f] shadow-[3px_3px_0_rgba(0,0,0,0.55)]">
                          <ChainBreakPixelIcon size={14} className="text-primary" />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-display text-sm uppercase tracking-[0.12em] text-primary">{displayName}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">#{formatted.validatorId}</span>
                        </div>
                        {canWithdraw ? (
                          <Badge variant="accent">Ready</Badge>
                        ) : (
                          <Badge variant="outline">Epoch {formatted.withdrawEpoch}</Badge>
                        )}
                      </div>
                      <span className="font-mono text-sm text-primary">{formatted.amount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] tracking-[0.1em] text-muted-foreground">
                      <HourglassPixelIcon size={12} className="text-primary" />
                      Slot <span className="font-mono text-xs text-foreground">{formatted.withdrawalId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center border-2 border-dashed border-border bg-secondary/30 p-8 text-center">
              <div className="space-y-1">
                <p className="font-display text-xs uppercase tracking-[0.12em] text-muted-foreground">No withdrawals</p>
                <p className="text-[11px] tracking-[0.12em] text-muted-foreground/70">Unstake to create withdrawal requests</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ShellSection>
  );
}

export default function AccountPage() {
  return (
    <ClientOnly>
      <AccountPageContent />
    </ClientOnly>
  );
}
