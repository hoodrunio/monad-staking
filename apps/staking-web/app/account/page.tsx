'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { formatDelegationRow, formatWithdrawalRow } from '@/lib/account-utils';
import { NetworkSelector } from '@/app/components/network-selector';
import { ClientOnly } from '@/app/components/client-only';
import { LoadingSkeleton } from '@/app/components/loading-skeleton';
import { useDelegationsQuery, useWithdrawalsQuery, useEpochQuery } from '@/lib/queries';
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

  // Always call hooks at the top level
  const { data: epochData } = useEpochQuery(selectedNetwork || 'monad-mainnet', {
    enabled: !!selectedNetwork && !!resolved
  });
  const { data: delegations, isLoading: delegationsLoading, error: delegationsError } = 
    useDelegationsQuery(selectedNetwork || 'monad-mainnet', address || '', '0', {
      enabled: !!selectedNetwork && !!resolved && !!address
    });
  const { data: withdrawals, isLoading: withdrawalsLoading, error: withdrawalsError } = 
    useWithdrawalsQuery(selectedNetwork || 'monad-mainnet', address || '', undefined, {
      enabled: !!selectedNetwork && !!resolved && !!address
    });

  if (!selectedNetwork) {
    return (
      <ShellSection width="default">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">My account</CardTitle>
            <CardDescription>No network configured.</CardDescription>
          </CardHeader>
        </Card>
      </ShellSection>
    );
  }

  if (!resolved) {
    return (
      <ShellSection width="default">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">My account</CardTitle>
            <CardDescription>Selected network is not fully configured.</CardDescription>
          </CardHeader>
        </Card>
      </ShellSection>
    );
  }

  if (!address) {
    return (
      <ShellSection as="div" className="space-y-6" width="wide">
        <div className="space-y-3">
          <div>
            <h1 className="mb-1 text-balance text-3xl font-bold">My Assets</h1>
            <p className="text-balance text-sm text-muted-foreground">
              Connect your wallet to view your staking positions on {resolved.key}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <NetworkSelector networks={enabledNetworks} selectedKey={selectedNetwork} />
          </div>
        </div>

        <Card className="border border-amber-300/30 bg-amber-400/10">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Wallet required</CardTitle>
            <CardDescription>Please connect your wallet to continue.</CardDescription>
          </CardHeader>
        </Card>
      </ShellSection>
    );
  }

  const currentEpoch = epochData ? BigInt(epochData.epoch) : 0n;

  return (
    <>
      <ShellSection as="div" className="space-y-3" width="wide">
        <div>
          <h1 className="mb-1 text-balance text-3xl font-bold">My Assets</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Manage your staked assets, rewards, and delegations on {resolved.key}
          </p>
          <p className="mt-2 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-mono text-muted-foreground">
            {address}
          </p>
        </div>
        <div className="w-full max-w-xs">
          <NetworkSelector networks={enabledNetworks} selectedKey={selectedNetwork} />
        </div>
      </ShellSection>

      <ShellSection width="wide">
        <div className="rounded-lg border border-border/50 bg-background/50 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold">Portfolio Overview</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="font-bold text-primary">Σ</span>
              </div>
              <div className="text-2xl font-bold">
                {delegations?.items.reduce((sum, d) => sum + Number(d.stake.decimal || 0), 0).toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Total Staked</div>
              <div className="text-xs text-primary">MON</div>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <span className="font-bold text-accent">🎁</span>
              </div>
              <div className="text-2xl font-bold">
                {delegations?.items.reduce((sum, d) => sum + Number(d.unclaimedRewards.decimal || 0), 0).toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Claimable Rewards</div>
              <div className="text-xs text-accent">MON</div>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                <span className="font-bold text-secondary">⏳</span>
              </div>
              <div className="text-2xl font-bold">{withdrawals?.items.length || 0}</div>
              <div className="text-sm text-muted-foreground">Pending Withdrawals</div>
              <div className="text-xs text-secondary">Slots</div>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="font-bold text-primary">📈</span>
              </div>
              <div className="text-2xl font-bold">24.8%</div>
              <div className="text-sm text-muted-foreground">APY</div>
              <div className="text-xs text-primary">Average</div>
            </div>
          </div>
        </div>
      </ShellSection>

      <ShellSection as="section" className="space-y-5" width="wide">
        <h2 className="text-xl font-semibold text-foreground">My delegations</h2>

        {delegationsError ? (
          <Card className="border border-destructive/40 bg-destructive/10 text-destructive-foreground">
            <CardHeader>
              <CardTitle className="text-base">Failed to load delegations</CardTitle>
              <CardDescription className="text-destructive-foreground/80">
                {delegationsError instanceof Error ? delegationsError.message : 'Unknown error'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : delegationsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <LoadingSkeleton className="h-4 w-32" />
                  <LoadingSkeleton className="h-4 w-24" />
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <LoadingSkeleton className="h-4 w-full" />
                  <LoadingSkeleton className="h-4 w-full" />
                  <LoadingSkeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : delegations && delegations.items.length > 0 ? (
          <div className="space-y-4">
            {delegations.items.map((delegation) => {
              const formatted = formatDelegationRow(delegation);
              return (
                <div key={formatted.validatorId} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Validator {formatted.validatorId}</h3>
                    <span className="text-sm text-muted-foreground">Stake: {formatted.stake}</span>
                  </div>

                  <div className="grid gap-4 text-sm md:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground">Unclaimed rewards</span>
                      <div className="font-mono text-foreground">{formatted.unclaimedRewards}</div>
                    </div>

                    {formatted.pendingChanges.deltaStake !== '0' ? (
                      <div>
                        <span className="text-muted-foreground">Pending change</span>
                        <div className="font-mono text-amber-200">
                          {formatMonFromWei(formatted.pendingChanges.deltaStake)} (Epoch {formatted.pendingChanges.deltaEpoch})
                        </div>
                      </div>
                    ) : null}

                    {formatted.pendingChanges.nextDeltaStake !== '0' ? (
                      <div>
                        <span className="text-muted-foreground">Next change</span>
                        <div className="font-mono text-sky-200">
                          {formatMonFromWei(formatted.pendingChanges.nextDeltaStake)} (Epoch {formatted.pendingChanges.nextDeltaEpoch})
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
            No delegations found. Start by delegating to a validator.
          </div>
        )}
      </ShellSection>

      <ShellSection as="section" className="space-y-5" width="wide">
        <h2 className="text-xl font-semibold text-foreground">Pending withdrawals</h2>

        {withdrawalsError ? (
          <Card className="border border-destructive/40 bg-destructive/10 text-destructive-foreground">
            <CardHeader>
              <CardTitle className="text-base">Failed to load withdrawals</CardTitle>
              <CardDescription className="text-destructive-foreground/80">
                {withdrawalsError instanceof Error ? withdrawalsError.message : 'Unknown error'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : withdrawalsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <LoadingSkeleton className="h-4 w-32" />
                  <LoadingSkeleton className="h-4 w-20" />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <LoadingSkeleton className="h-4 w-full" />
                  <LoadingSkeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : withdrawals && withdrawals.items.length > 0 ? (
          <div className="space-y-4">
            {withdrawals.items.map((withdrawal) => {
              const formatted = formatWithdrawalRow(withdrawal);
              const canWithdraw = formatted.canWithdraw(currentEpoch);

              return (
                <div
                  key={`${formatted.validatorId}-${formatted.withdrawalId}`}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      Validator {formatted.validatorId} (ID: {formatted.withdrawalId})
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{formatted.amount}</span>
                      {canWithdraw ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {canWithdraw ? 'Available for withdrawal now' : `Available in epoch ${formatted.withdrawEpoch}`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
            No pending withdrawals found.
          </div>
        )}
      </ShellSection>
    </>
  );
}

export default function AccountPage() {
  return (
    <ClientOnly>
      <AccountPageContent />
    </ClientOnly>
  );
}
