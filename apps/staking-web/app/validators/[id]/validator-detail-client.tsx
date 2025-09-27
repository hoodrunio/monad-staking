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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

interface ValidatorDetailClientProps {
  validatorId: string;
  networkParam?: string;
}

export function ValidatorDetailClient({ validatorId, networkParam }: ValidatorDetailClientProps) {
  const configMap = getNetworkConfigMap();
  const enabledNetworks = getEnabledNetworkConfigs(configMap);
  const selectedNetwork = getSelectedNetwork(networkParam, enabledNetworks);
  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;

  const queryEnabled = Boolean(selectedNetwork && resolved);
  const { data: validator, isLoading, error } = useValidatorQuery(
    (selectedNetwork ?? 'monad-mainnet'),
    validatorId,
    { enabled: queryEnabled },
  );

  if (!selectedNetwork) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Validator detail</CardTitle>
          <CardDescription>No network configured.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!resolved) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Validator detail</CardTitle>
          <CardDescription>Selected network is not fully configured.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return <ValidatorDetailSkeleton />;
  }

  const backLink = (
    <Link
      href={`/validators?network=${selectedNetwork}`}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      Back to validators
    </Link>
  );

  if (error) {
    return (
      <div className="space-y-6">
        {backLink}
        <Card className="border border-destructive/40 bg-destructive/10 text-destructive-foreground">
          <CardHeader>
            <CardTitle className="text-base">Failed to load validator</CardTitle>
            <CardDescription className="text-destructive-foreground/80">
              {error instanceof Error ? error.message : 'Unknown error occurred.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!validator) {
    return (
      <div className="space-y-6">
        {backLink}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validator not found</CardTitle>
            <CardDescription>Validator {validatorId} was not found on {resolved.label}.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const displayName = getValidatorDisplayName(validator);
  const metadataAvailable = hasValidatorMetadata(validator);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          {backLink}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground">Validator #{validatorId} on {resolved.label}</p>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <NetworkSelector networks={enabledNetworks} selectedKey={selectedNetwork} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">Validator ID</span>
              <span className="font-mono text-foreground">{validatorId}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">Auth address</span>
              <ExplorerLink
                config={resolved}
                type="address"
                value={validator.authAddress}
                className="font-mono text-xs text-primary hover:text-primary/80"
              >
                {validator.authAddress}
              </ExplorerLink>
            </div>
            {metadataAvailable ? (
              <>
                {validator.meta?.name ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide">Name</span>
                    <span className="text-foreground">{validator.meta.name}</span>
                  </div>
                ) : null}
                {validator.meta?.description ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide">Description</span>
                    <p className="text-sm text-muted-foreground">{validator.meta.description}</p>
                  </div>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stake</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">Active stake</span>
              <span className="text-foreground">{validator.stake.formatted}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">Current</span>
              <span className="text-foreground">{validator.commission.formatted}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">Raw</span>
              <span className="font-mono text-xs text-muted-foreground">{validator.commission.raw}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">Unclaimed rewards</span>
              <span className="text-foreground">{validator.unclaimedRewards.formatted}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Public keys</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">SECP256K1</span>
              <div className="break-all font-mono text-xs text-foreground/80">{validator.keys.secpPubkey}</div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">BLS</span>
              <div className="break-all font-mono text-xs text-foreground/80">{validator.keys.blsPubkey}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide">Flags</span>
            <div className="mt-1 font-mono text-foreground">{validator.flagsRaw}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
