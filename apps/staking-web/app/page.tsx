'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { NetworkSelector } from '@/app/components/network-selector';
import { LoadingSkeleton } from '@/app/components/loading-skeleton';
import { useEpochQuery } from '@/lib/queries';
import { MONAD_NETWORK_KEYS } from '@monad-staking/config';

export default function HomePage() {
  const searchParams = useSearchParams();
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabledNetworks = getEnabledNetworkConfigs(configMap);

  if (enabledNetworks.length === 0) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Monad Staking Dashboard</h1>
          <p className="text-slate-400">
            Configure environment variables for at least one Monad network to
            get started.
          </p>
        </header>
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-slate-200">Required Variables</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {MONAD_NETWORK_KEYS.map((key) => (
              <li key={key}>
                <code className="rounded bg-slate-800 px-2 py-1">
                  {key.toUpperCase().replace(/-/g, '_')}_RPC_URL
                </code>{' '}
                &{' '}
                <code className="rounded bg-slate-800 px-2 py-1">
                  {key.toUpperCase().replace(/-/g, '_')}_CHAIN_ID
                </code>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  const networkParam = searchParams.get('network');
  const selectedNetwork = getSelectedNetwork(networkParam, enabledNetworks);

  if (!selectedNetwork) {
    return null;
  }

  const resolved = tryResolveNetwork(configMap, selectedNetwork);
  if (!resolved) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-slate-400">Selected network is not fully configured.</p>
      </div>
    );
  }

  const { data: epochData, isLoading, error } = useEpochQuery(selectedNetwork);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Monad Staking Dashboard</h1>
          <p className="text-slate-400">
            Overview of staking information on {resolved.name}
          </p>
        </div>
        <NetworkSelector networks={enabledNetworks} selectedKey={selectedNetwork} />
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">Epoch Overview</h2>
        
        {error ? (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-6 text-sm text-red-200">
            Failed to load epoch information: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <LoadingSkeleton className="h-4 w-20 mb-2" />
                <LoadingSkeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : epochData ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-sm font-medium text-slate-400">Current Epoch</h3>
              <p className="mt-1 text-2xl font-semibold text-slate-100">
                {epochData.epoch}
              </p>
            </div>
            
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-sm font-medium text-slate-400">Epoch Status</h3>
              <p className="mt-1 text-2xl font-semibold text-slate-100">
                {epochData.inEpochDelayPeriod ? (
                  <span className="text-amber-400">Delay Period</span>
                ) : (
                  <span className="text-emerald-400">Active</span>
                )}
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-sm font-medium text-slate-400">Epoch Length</h3>
              <p className="mt-1 text-2xl font-semibold text-slate-100">
                {epochData.epochLength.toLocaleString()} blocks
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-sm font-medium text-slate-400">Withdrawal Delay</h3>
              <p className="mt-1 text-2xl font-semibold text-slate-100">
                {epochData.withdrawalDelay} epochs
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">Activation Windows</h2>
        {epochData ? (
          <div className="rounded-lg border border-blue-900/40 bg-blue-950/30 p-6">
            <div className="space-y-3 text-sm text-blue-200">
              <div className="flex items-center justify-between">
                <span>New delegations become active:</span>
                <span className="font-mono">
                  Epoch {(BigInt(epochData.epoch) + (epochData.inEpochDelayPeriod ? 2n : 1n)).toString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>New undelegations become inactive:</span>
                <span className="font-mono">
                  Epoch {(BigInt(epochData.epoch) + (epochData.inEpochDelayPeriod ? 2n : 1n)).toString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Undelegated funds withdrawable:</span>
                <span className="font-mono">
                  Epoch {(BigInt(epochData.epoch) + (epochData.inEpochDelayPeriod ? 2n : 1n) + BigInt(epochData.withdrawalDelay)).toString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <LoadingSkeleton className="h-24 w-full" />
        )}
      </section>
    </div>
  );
}