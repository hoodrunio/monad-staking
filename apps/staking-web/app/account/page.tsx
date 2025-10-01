'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { Coins, TrendingUp, Clock, Wallet } from 'lucide-react';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { formatDelegationRow, formatWithdrawalRow } from '@/lib/account-utils';
import { ClientOnly } from '@/app/components/client-only';
import { LoadingSkeleton } from '@/app/components/loading-skeleton';
import { useDelegationsQuery, useWithdrawalsQuery, useEpochQuery, useValidatorsQuery } from '@/lib/queries';
import { formatMonFromWei } from '@/lib/utils';
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ShellSection } from '@/app/components/layout/shell';

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
  const { data: validators } = useValidatorsQuery(selectedNetwork || 'monad-mainnet', '', 100, {
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
          <h1 className="text-2xl font-semibold tracking-tight">My Account</h1>
          <p className="mt-1 text-sm text-muted-foreground/80">Connect wallet to view positions</p>
        </div>
        <div className="flex items-center justify-center rounded-lg bg-muted/10 p-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Wallet required</p>
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
      {/* Compact Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Account</h1>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground/70">{address}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-muted-foreground/70">Staked:</span>
            <span className="font-mono font-semibold text-foreground">{totalStaked.toFixed(2)}</span>
          </div>
          <span className="text-muted-foreground/30">•</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-accent/70" />
            <span className="text-muted-foreground/70">Rewards:</span>
            <span className="font-mono font-semibold text-accent">{totalRewards.toFixed(4)}</span>
          </div>
          <span className="text-muted-foreground/30">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-muted-foreground/70">Pending:</span>
            <span className="font-mono font-semibold text-foreground">{withdrawals?.items.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Delegations */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold tracking-tight">Delegations</h2>
            <span className="text-xs text-muted-foreground/70">{delegations?.items.length || 0} active</span>
          </div>

          {delegationsError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Failed to load delegations
            </div>
          ) : delegationsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-20 w-full rounded-lg" />
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
                    className="rounded-lg border border-border/40 bg-muted/5 p-3 transition-colors hover:border-border/60 hover:bg-muted/10"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{displayName}</span>
                          {validatorInfo?.name && (
                            <span className="text-xs text-muted-foreground/70">#{formatted.validatorId}</span>
                          )}
                        </div>
                        {hasPending && (
                          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                            Pending
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-semibold text-primary">{formatted.stake}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground/70">Rewards:</span>
                        <span className="font-mono text-accent">{formatted.unclaimedRewards}</span>
                      </div>
                      {formatted.pendingChanges.deltaStake !== '0' && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground/70">Pending:</span>
                          <span className="font-mono text-amber-400">
                            {formatMonFromWei(formatted.pendingChanges.deltaStake)} (E{formatted.pendingChanges.deltaEpoch})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border/40 bg-muted/5 p-8 text-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">No delegations</p>
                <p className="text-xs text-muted-foreground/70">Start staking to earn rewards</p>
              </div>
            </div>
          )}
        </div>

        {/* Withdrawals */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold tracking-tight">Withdrawals</h2>
            <span className="text-xs text-muted-foreground/70">
              {readyWithdrawals.length > 0 ? `${readyWithdrawals.length} ready` : 'None ready'}
            </span>
          </div>

          {withdrawalsError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Failed to load withdrawals
            </div>
          ) : withdrawalsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-20 w-full rounded-lg" />
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
                    className="rounded-lg border border-border/40 bg-muted/5 p-3 transition-colors hover:border-border/60 hover:bg-muted/10"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{displayName}</span>
                          {validatorInfo?.name && (
                            <span className="text-xs text-muted-foreground/70">#{formatted.validatorId}</span>
                          )}
                        </div>
                        {canWithdraw ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                            <div className="h-1 w-1 rounded-full bg-emerald-400" />
                            Ready
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                            Epoch {formatted.withdrawEpoch}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-semibold text-foreground">{formatted.amount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground/70">Slot:</span>
                      <span className="font-mono text-muted-foreground">{formatted.withdrawalId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border/40 bg-muted/5 p-8 text-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">No withdrawals</p>
                <p className="text-xs text-muted-foreground/70">Unstake to create withdrawal requests</p>
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
