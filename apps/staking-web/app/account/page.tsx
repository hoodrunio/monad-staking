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
import type { MonadNetwork } from '@monad-staking/config';

function AccountPageContent() {
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabledNetworks = getEnabledNetworkConfigs(configMap);

  const networkParam = searchParams.get('network');
  const selectedNetwork = getSelectedNetwork(networkParam, enabledNetworks);

  if (!selectedNetwork) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">My Account</h1>
        <p className="text-slate-400">No network configured.</p>
      </div>
    );
  }

  const resolved = tryResolveNetwork(configMap, selectedNetwork);
  if (!resolved) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">My Account</h1>
        <p className="text-slate-400">Selected network is not fully configured.</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">My Account</h1>
            <p className="text-slate-400">
              Connect your wallet to view your staking positions on {resolved.name}
            </p>
          </div>
          <NetworkSelector networks={enabledNetworks} selectedKey={selectedNetwork} />
        </header>
        
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/30 p-6">
          <p className="text-amber-200">Please connect your wallet to continue.</p>
        </div>
      </div>
    );
  }

  const { data: epochData } = useEpochQuery(selectedNetwork);
  const { data: delegations, isLoading: delegationsLoading, error: delegationsError } = 
    useDelegationsQuery(selectedNetwork, address);
  const { data: withdrawals, isLoading: withdrawalsLoading, error: withdrawalsError } = 
    useWithdrawalsQuery(selectedNetwork, address);

  const currentEpoch = epochData ? BigInt(epochData.epoch) : 0n;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">My Account</h1>
          <p className="text-slate-400">
            Your staking positions on {resolved.name}
          </p>
          <p className="text-xs text-slate-500 font-mono">
            {address}
          </p>
        </div>
        <NetworkSelector networks={enabledNetworks} selectedKey={selectedNetwork} />
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">My Delegations</h2>
        
        {delegationsError ? (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-6 text-sm text-red-200">
            Failed to load delegations: {delegationsError instanceof Error ? delegationsError.message : 'Unknown error'}
          </div>
        ) : delegationsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between mb-3">
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
          <div className="space-y-3">
            {delegations.items.map((delegation) => {
              const formatted = formatDelegationRow(delegation);
              return (
                <div key={formatted.validatorId} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-200">
                      Validator {formatted.validatorId}
                    </h3>
                    <span className="text-sm text-slate-400">
                      Stake: {formatted.stake}
                    </span>
                  </div>
                  
                  <div className="grid gap-4 text-sm md:grid-cols-3">
                    <div>
                      <span className="text-slate-400">Unclaimed Rewards:</span>
                      <div className="font-mono text-slate-200">{formatted.unclaimedRewards}</div>
                    </div>
                    
                    {formatted.pendingChanges.deltaStake !== '0' && (
                      <div>
                        <span className="text-slate-400">Pending Change:</span>
                        <div className="font-mono text-amber-300">
                          {formatted.pendingChanges.deltaStake} (Epoch {formatted.pendingChanges.deltaEpoch})
                        </div>
                      </div>
                    )}
                    
                    {formatted.pendingChanges.nextDeltaStake !== '0' && (
                      <div>
                        <span className="text-slate-400">Next Change:</span>
                        <div className="font-mono text-blue-300">
                          {formatted.pendingChanges.nextDeltaStake} (Epoch {formatted.pendingChanges.nextDeltaEpoch})
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
            No delegations found. Start by delegating to a validator.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">Pending Withdrawals</h2>
        
        {withdrawalsError ? (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-6 text-sm text-red-200">
            Failed to load withdrawals: {withdrawalsError instanceof Error ? withdrawalsError.message : 'Unknown error'}
          </div>
        ) : withdrawalsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between mb-3">
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
          <div className="space-y-3">
            {withdrawals.items.map((withdrawal) => {
              const formatted = formatWithdrawalRow(withdrawal);
              const canWithdraw = formatted.canWithdraw(currentEpoch);
              
              return (
                <div key={`${formatted.validatorId}-${formatted.withdrawalId}`} 
                     className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-200">
                      Validator {formatted.validatorId} (ID: {formatted.withdrawalId})
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">
                        {formatted.amount}
                      </span>
                      {canWithdraw ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-900/40 px-2 py-1 text-xs text-emerald-300">
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-900/40 px-2 py-1 text-xs text-amber-300">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-400">
                    {canWithdraw ? (
                      <span className="text-emerald-300">
                        Available for withdrawal now
                      </span>
                    ) : (
                      <span>
                        Available in epoch {formatted.withdrawEpoch}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
            No pending withdrawals found.
          </div>
        )}
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ClientOnly>
      <AccountPageContent />
    </ClientOnly>
  );
}