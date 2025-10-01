'use client';

import Link from 'next/link';
import { ArrowLeft, Coins, TrendingUp, Shield, Key, Flag, ExternalLink } from 'lucide-react';
import { useValidatorQuery } from '@/lib/queries';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { getValidatorDisplayName, hasValidatorMetadata } from '@/lib/validator-detail-utils';
import { ValidatorDetailSkeleton } from '@/app/components/loading-skeleton';
import { ExplorerLink } from '@/app/components/explorer-link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ShellSection } from '@/app/components/layout/shell';

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
      <ShellSection width="default">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Validator detail</CardTitle>
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
            <CardTitle className="text-2xl">Validator detail</CardTitle>
            <CardDescription>Selected network is not fully configured.</CardDescription>
          </CardHeader>
        </Card>
      </ShellSection>
    );
  }

  if (isLoading) {
    return <ValidatorDetailSkeleton />;
  }

  const backLink = (
    <Link
      href={`/validators?network=${selectedNetwork}`}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to validators
    </Link>
  );

  if (error) {
    return (
      <ShellSection as="div" className="space-y-6" width="wide">
        {backLink}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8">
          <h3 className="text-xl font-semibold text-destructive">Failed to load validator</h3>
          <p className="mt-2 text-sm text-destructive/80">
            {error instanceof Error ? error.message : 'Unknown error occurred.'}
          </p>
        </div>
      </ShellSection>
    );
  }

  if (!validator) {
    return (
      <ShellSection as="div" className="space-y-6" width="wide">
        {backLink}
        <div className="rounded-xl border border-border/50 bg-muted/5 p-8">
          <h3 className="text-xl font-semibold text-foreground">Validator not found</h3>
          <p className="mt-2 text-sm text-muted-foreground/80">
            Validator {validatorId} was not found on {resolved.label}.
          </p>
        </div>
      </ShellSection>
    );
  }

  const displayName = getValidatorDisplayName(validator);
  const metadataAvailable = hasValidatorMetadata(validator);
  const isActive = validator.isActive;

  return (
    <>
      {/* Navigation */}
      <ShellSection width="wide">
        {backLink}
      </ShellSection>

      {/* Hero Section */}
      <ShellSection width="wide">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 sm:p-10">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
          <div className="relative">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span className="uppercase tracking-wider text-muted-foreground/80">
                    Validator #{validatorId}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
                  {displayName}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground/80">
                  Operating on {resolved.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {metadataAvailable && validator.meta?.description && (
              <div className="mt-6 max-w-2xl rounded-lg bg-background/50 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {validator.meta.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </ShellSection>

      {/* Key Metrics */}
      <ShellSection width="wide">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Total Stake */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-transparent p-6">
            <div className="absolute right-4 top-4 opacity-20 transition-opacity group-hover:opacity-30">
              <Coins className="h-12 w-12" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground/70">
                <Coins className="h-3.5 w-3.5" />
                Total Stake
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {validator.stake.formatted.split(' ')[0]}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">MON</div>
            </div>
          </div>

          {/* Commission */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/5 to-transparent p-6">
            <div className="absolute right-4 top-4 opacity-20 transition-opacity group-hover:opacity-30">
              <TrendingUp className="h-12 w-12" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground/70">
                <TrendingUp className="h-3.5 w-3.5" />
                Commission
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {validator.commission.formatted}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground/70">
                Raw: {validator.commission.raw}
              </div>
            </div>
          </div>

          {/* Unclaimed Rewards */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-transparent p-6">
            <div className="absolute right-4 top-4 opacity-20 transition-opacity group-hover:opacity-30">
              <TrendingUp className="h-12 w-12" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground/70">
                <TrendingUp className="h-3.5 w-3.5" />
                Unclaimed Rewards
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-accent">
                {validator.unclaimedRewards.formatted.split(' ')[0]}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">MON</div>
            </div>
          </div>
        </div>
      </ShellSection>

      {/* Detailed Information */}
      <ShellSection as="div" className="space-y-8" width="wide">
        {/* Identity Section */}
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Identity</h2>
            <p className="mt-1 text-sm text-muted-foreground/80">
              On-chain identification and metadata
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Basic Info */}
            <div className="rounded-xl border border-border/50 bg-muted/5 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Shield className="h-5 w-5 text-primary" />
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground/70">
                    Validator ID
                  </div>
                  <div className="mt-1 font-mono text-base font-medium text-foreground">
                    {validatorId}
                  </div>
                </div>

                {metadataAvailable && validator.meta?.name && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground/70">
                      Display Name
                    </div>
                    <div className="mt-1 text-base font-medium text-foreground">
                      {validator.meta.name}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground/70">
                    Status Flags
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground/50" />
                    <span className="font-mono text-sm text-foreground">
                      {validator.flagsRaw}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Auth Address */}
            <div className="rounded-xl border border-border/50 bg-muted/5 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight">
                <ExternalLink className="h-5 w-5 text-primary" />
                Authorization Address
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground/70 mb-2">
                    Address
                  </div>
                  <ExplorerLink
                    config={resolved}
                    type="address"
                    value={validator.authAddress}
                    className="inline-flex items-center gap-2 break-all rounded-lg bg-background/50 px-3 py-2 font-mono text-xs text-primary transition-colors hover:bg-background/70 hover:text-primary/80"
                  >
                    {validator.authAddress}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </ExplorerLink>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Click to view on block explorer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Keys */}
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Cryptographic Keys</h2>
            <p className="mt-1 text-sm text-muted-foreground/80">
              Public keys used for validation and signing
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* SECP256K1 Key */}
            <div className="rounded-xl border border-border/50 bg-muted/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">SECP256K1</h3>
                  <p className="text-xs text-muted-foreground/70">Ethereum-compatible key</p>
                </div>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <div className="break-all font-mono text-xs leading-relaxed text-foreground/80">
                  {validator.keys.secpPubkey}
                </div>
              </div>
            </div>

            {/* BLS Key */}
            <div className="rounded-xl border border-border/50 bg-muted/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Key className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">BLS</h3>
                  <p className="text-xs text-muted-foreground/70">Signature aggregation key</p>
                </div>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <div className="break-all font-mono text-xs leading-relaxed text-foreground/80">
                  {validator.keys.blsPubkey}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ShellSection>
    </>
  );
}
