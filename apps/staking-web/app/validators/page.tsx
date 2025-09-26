'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MONAD_NETWORK_KEYS } from '@monad-staking/config';
import { NetworkSelector } from '@/app/components/network-selector';
import { PaginationControls } from '@/app/components/pagination-controls';
import { ValidatorTable } from '@/app/components/validator-table';
import { ValidatorTableSkeleton } from '@/app/components/loading-skeleton';
import { ClientOnly } from '@/app/components/client-only';
import { useValidatorsQuery } from '@/lib/queries';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { normalizeCursor } from '@/lib/validators-utils';

function ValidatorsPageContent() {
  const searchParams = useSearchParams();
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabledNetworks = getEnabledNetworkConfigs(configMap);
  
  const networkParam = searchParams.get('network');
  const selectedNetwork = getSelectedNetwork(networkParam, enabledNetworks);
  const cursor = normalizeCursor(searchParams.get('cursor') ?? undefined);

  // Always call hooks at the top level
  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;
  const { data: pageData, isLoading, error } = useValidatorsQuery(
    selectedNetwork || 'monad-mainnet', // provide fallback to avoid undefined
    cursor, 
    50,
    { enabled: !!selectedNetwork && !!resolved }
  );

  if (enabledNetworks.length === 0) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Validator Explorer</h1>
          <p className="text-slate-400">
            Configure environment variables for at least one Monad network to
            inspect validators.
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

  if (!selectedNetwork) {
    return null;
  }

  if (!resolved) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Validator Explorer</h1>
        <p className="text-slate-400">Selected network is not fully configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Validator Explorer</h1>
            <p className="text-slate-400">
              Browse validators on the selected Monad network.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <NetworkSelector
              networks={enabledNetworks}
              selectedKey={selectedNetwork}
            />
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-6 text-sm text-red-200">
          {error instanceof Error ? error.message : 'Failed to load validators'}
        </div>
      ) : isLoading ? (
        <ValidatorTableSkeleton />
      ) : pageData ? (
        <div className="space-y-4">
          <ValidatorTable
            validators={pageData.items.map((item) => ({
              id: item.id,
              authAddress: item.authAddress,
              commission: item.commission.formatted,
              stake: item.stake.formatted,
              unclaimedRewards: item.unclaimedRewards.formatted,
              flagsRaw: item.flagsRaw,
              isActive: item.isActive,
            }))}
            networkConfig={resolved}
          />
          <PaginationControls
            prevCursor={pageData.cursor.prev}
            nextCursor={pageData.cursor.next}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function ValidatorsPage() {
  return (
    <ClientOnly fallback={
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Validator Explorer</h1>
        <p className="text-slate-400">Loading...</p>
      </div>
    }>
      <ValidatorsPageContent />
    </ClientOnly>
  );
}
