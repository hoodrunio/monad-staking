'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useValidatorQuery } from '@/lib/queries';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { getValidatorDisplayName, hasValidatorMetadata } from '@/lib/validator-detail-utils';
import { ValidatorDetailSkeleton } from '@/app/components/loading-skeleton';
import { ExplorerLink } from '@/app/components/explorer-link';
import { NetworkSelector } from '@/app/components/network-selector';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function ValidatorDetailPage(props: PageProps) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  
  const configMap = getNetworkConfigMap();
  const enabled = getEnabledNetworkConfigs(configMap);
  
  const networkParam = Array.isArray(searchParams['network']) 
    ? searchParams['network'][0] 
    : searchParams['network'];
  const selectedNetwork = getSelectedNetwork(networkParam, enabled);
  
  // Always call hooks at the top level
  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;
  const { data: validator, isLoading, error } = useValidatorQuery(
    selectedNetwork!, 
    params.id,
    { enabled: !!selectedNetwork && !!resolved }
  );
  
  if (!selectedNetwork) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Validator Detail</h1>
        <p className="text-slate-400">No network configured</p>
      </div>
    );
  }

  if (!resolved) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Validator Detail</h1>
        <p className="text-slate-400">Network not fully configured</p>
      </div>
    );
  }

  if (isLoading) {
    return <ValidatorDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/validators?network=${selectedNetwork}`}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Validators
          </Link>
        </div>
        <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold text-red-200">Failed to load validator</h2>
          <p className="mt-2 text-sm text-red-300">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  if (!validator) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/validators?network=${selectedNetwork}`}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Validators
          </Link>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-slate-300">Validator not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/validators?network=${selectedNetwork}`}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Validators
          </Link>
        </div>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">
              {getValidatorDisplayName(validator)}
            </h1>
            <p className="text-slate-400">
              Detailed information for validator ID {validator.validatorId}
            </p>
          </div>
          <NetworkSelector networks={enabled} selectedKey={selectedNetwork} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Basic Information</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Validator ID</dt>
                <dd className="font-mono text-slate-50">{validator.validatorId}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Auth Address</dt>
                <dd className="font-mono text-xs">
                  <ExplorerLink 
                    config={resolved} 
                    type="address" 
                    value={validator.authAddress}
                  >
                    {validator.authAddress}
                  </ExplorerLink>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Commission</dt>
                <dd className="font-mono text-slate-50">{validator.commission}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Unclaimed Rewards</dt>
                <dd className="font-mono text-slate-50">{validator.unclaimedRewards}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Flags</dt>
                <dd className="font-mono text-slate-50">{validator.flagsRaw}</dd>
              </div>
            </dl>
          </div>

          {hasValidatorMetadata(validator) && (
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-6">
              <h2 className="text-xl font-semibold text-emerald-200 mb-4">Validator Info</h2>
              <div className="space-y-3 text-sm">
                {validator.meta?.description && (
                  <p className="text-emerald-100/80">{validator.meta.description}</p>
                )}
                {validator.meta?.website && (
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300">Website</span>
                    <a 
                      href={validator.meta.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      {validator.meta.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Stake Information</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Execution Stake</dt>
                <dd className="font-mono text-slate-50">{validator.stake.execution}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Consensus Stake</dt>
                <dd className="font-mono text-slate-50">{validator.stake.consensus}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Snapshot Stake</dt>
                <dd className="font-mono text-slate-50">{validator.stake.snapshot}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Consensus Keys</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-400 mb-1">SECP Public Key</dt>
                <dd className="font-mono text-xs text-slate-50 break-all">
                  {validator.keys.secpPubkey}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 mb-1">BLS Public Key</dt>
                <dd className="font-mono text-xs text-slate-50 break-all">
                  {validator.keys.blsPubkey}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
