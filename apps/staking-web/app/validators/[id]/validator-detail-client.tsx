'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useValidatorQuery } from '@/lib/queries';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { getValidatorDisplayName, hasValidatorMetadata } from '@/lib/validator-detail-utils';
import { ValidatorDetailSkeleton } from '@/app/components/loading-skeleton';
import { ExplorerLink } from '@/app/components/explorer-link';
import { NetworkSelector } from '@/app/components/network-selector';

interface ValidatorDetailClientProps {
  validatorId: string;
  networkParam?: string;
}

export function ValidatorDetailClient({ validatorId, networkParam }: ValidatorDetailClientProps) {
  const configMap = getNetworkConfigMap();
  const enabled = getEnabledNetworkConfigs(configMap);
  const selectedNetwork = getSelectedNetwork(networkParam, enabled);
  
  // Always call hooks at the top level
  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;
  const { data: validator, isLoading, error } = useValidatorQuery(
    selectedNetwork!, 
    validatorId,
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
          <h2 className="text-lg font-semibold text-slate-200">Validator not found</h2>
          <p className="mt-2 text-sm text-slate-400">
            Validator {validatorId} was not found on {resolved.key}.
          </p>
        </div>
      </div>
    );
  }

  const displayName = getValidatorDisplayName(validator);
  const hasMetadata = hasValidatorMetadata(validator);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/validators?network=${selectedNetwork}`}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-300"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Validators
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-100">
              {displayName}
            </h1>
            <p className="text-slate-400">
              Validator #{validatorId} on {resolved.key}
            </p>
          </div>
        </div>
        <NetworkSelector networks={enabled} selectedKey={selectedNetwork} />
      </div>

      {/* Validator Info Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Info */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Basic Info</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400">Validator ID:</span>
              <span className="ml-2 font-mono text-slate-200">{validatorId}</span>
            </div>
            <div>
              <span className="text-slate-400">Auth Address:</span>
              <div className="mt-1">
                <ExplorerLink 
                  config={resolved}
                  type="address"
                  value={validator.authAddress}
                  className="font-mono text-xs text-blue-400 hover:text-blue-300"
                >
                  {validator.authAddress}
                </ExplorerLink>
              </div>
            </div>
            {hasMetadata && (
              <>
                {validator.meta?.name && (
                  <div>
                    <span className="text-slate-400">Name:</span>
                    <span className="ml-2 text-slate-200">{validator.meta.name}</span>
                  </div>
                )}
                {validator.meta?.description && (
                  <div>
                    <span className="text-slate-400">Description:</span>
                    <p className="mt-1 text-slate-300">{validator.meta.description}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stake Info */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Stake</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400">Execution Stake:</span>
              <span className="ml-2 text-slate-200">{validator.stake.execution} MON</span>
            </div>
            <div>
              <span className="text-slate-400">Consensus Stake:</span>
              <span className="ml-2 text-slate-200">{validator.stake.consensus} MON</span>
            </div>
            <div>
              <span className="text-slate-400">Snapshot Stake:</span>
              <span className="ml-2 text-slate-200">{validator.stake.snapshot} MON</span>
            </div>
          </div>
        </div>

        {/* Commission Info */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Commission</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400">Current:</span>
              <span className="ml-2 text-slate-200">{validator.commission}%</span>
            </div>
            <div>
              <span className="text-slate-400">Raw:</span>
              <span className="ml-2 font-mono text-xs text-slate-300">{validator.commissionRaw}</span>
            </div>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Rewards</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400">Unclaimed Rewards:</span>
              <span className="ml-2 text-slate-200">{validator.unclaimedRewards} MON</span>
            </div>
          </div>
        </div>

        {/* Public Keys */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Public Keys</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400">SECP256K1:</span>
              <div className="mt-1 break-all font-mono text-xs text-slate-300">
                {validator.keys.secpPubkey}
              </div>
            </div>
            <div>
              <span className="text-slate-400">BLS:</span>
              <div className="mt-1 break-all font-mono text-xs text-slate-300">
                {validator.keys.blsPubkey}
              </div>
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Status</h2>
          <div className="text-sm">
            <span className="text-slate-400">Flags:</span>
            <span className="ml-2 font-mono text-slate-200">{validator.flagsRaw}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
