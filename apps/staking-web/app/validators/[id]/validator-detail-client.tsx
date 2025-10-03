'use client';

import Link from 'next/link';
import {
  ChainBreakPixelIcon,
  ChestPixelIcon,
  CoinPixelIcon,
  KnightPixelIcon,
  SparklePixelIcon,
} from '@/app/components/icons';
import { useValidatorQuery } from '@/lib/queries';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { getValidatorDisplayName, hasValidatorMetadata } from '@/lib/validator-detail-utils';
import { ValidatorDetailSkeleton } from '@/app/components/loading-skeleton';
import { ExplorerLink } from '@/app/components/explorer-link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ShellSection } from '@/app/components/layout/shell';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';

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
    <Button
      asChild
      variant="outline"
      size="sm"
      className="inline-flex items-center gap-2 border-2 border-border bg-secondary/40 px-3 py-1.5 font-display text-xs uppercase tracking-[0.12em] text-muted-foreground hover:border-primary hover:text-primary"
    >
      <Link href={`/validators?network=${selectedNetwork}`}>
        <ChainBreakPixelIcon size={12} className="text-primary" />
        Back to validators
      </Link>
    </Button>
  );

  if (error) {
    return (
      <ShellSection as="div" className="space-y-6" width="wide">
        {backLink}
        <Card className="gap-0 border-2 border-destructive bg-secondary/40 text-destructive shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-3">
              <ChainBreakPixelIcon size={16} className="text-destructive" />
              <CardTitle className="font-display text-lg uppercase tracking-[0.14em] text-destructive">Failed to load validator</CardTitle>
            </div>
            <CardDescription className="text-sm tracking-[0.06em] text-destructive/80">
              {error instanceof Error ? error.message : 'Unknown error occurred.'}
            </CardDescription>
          </CardHeader>
        </Card>
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
        <div className="border-2 border-border bg-secondary/40 p-6 shadow-[6px_6px_0_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 items-center justify-center border-2 border-primary bg-[#12092f] shadow-[4px_4px_0_rgba(0,0,0,0.55)]">
                <KnightPixelIcon size={24} className="text-primary" />
              </span>
              <div className="flex flex-col gap-2">
                <span className="font-display text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Validator #{validatorId}
                </span>
                <h1 className="font-display text-3xl uppercase tracking-[0.12em] text-primary sm:text-4xl">
                  {displayName}
                </h1>
                <p className="text-[11px] tracking-[0.1em] text-muted-foreground">
                  Operating on {resolved.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? 'accent' : 'outline'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          {metadataAvailable && validator.meta?.description && (
            <div className="mt-6 border-2 border-border bg-secondary/30 p-4 text-sm leading-relaxed text-muted-foreground">
              {validator.meta.description}
            </div>
          )}
        </div>
      </ShellSection>

      {/* Key Metrics */}
      <ShellSection width="wide">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="space-y-4 px-6 py-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <CoinPixelIcon size={14} className="text-primary" />
              Total Stake
            </div>
            <div className="font-display text-3xl tracking-[0.1em] text-primary">
              {validator.stake.formatted}
            </div>
          </Card>
          <Card className="space-y-4 px-6 py-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <SparklePixelIcon size={14} className="text-primary" />
              Commission
            </div>
            <div className="font-display text-3xl tracking-[0.1em] text-primary">
              {validator.commission.formatted}
            </div>
            <div className="font-mono text-xs text-muted-foreground">Raw: {validator.commission.raw}</div>
          </Card>
          <Card className="space-y-4 px-6 py-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <ChestPixelIcon size={14} className="text-accent" />
              Unclaimed Rewards
            </div>
            <div className="font-display text-3xl tracking-[0.1em] text-accent">
              {validator.unclaimedRewards.formatted}
            </div>
          </Card>
        </div>
      </ShellSection>

      {/* Detailed Information */}
      <ShellSection as="div" className="space-y-8" width="wide">
        {/* Identity Section */}
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-lg uppercase tracking-[0.14em] text-primary">Identity</h2>
            <p className="text-[11px] tracking-[0.12em] text-muted-foreground/80">
              On-chain identification and metadata
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="border-2 border-border bg-secondary/40 p-6 shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
              <h3 className="mb-4 flex items-center gap-2 font-display text-sm uppercase tracking-[0.12em] text-primary">
                <KnightPixelIcon size={14} className="text-primary" />
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Validator ID</div>
                  <div className="mt-1 font-mono text-sm text-foreground">{validatorId}</div>
                </div>

                {metadataAvailable && validator.meta?.name && (
                  <div>
                    <div className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Display Name</div>
                    <div className="mt-1 font-display text-base uppercase tracking-[0.14em] text-primary">{validator.meta.name}</div>
                  </div>
                )}

                <div>
                  <div className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Status Flags</div>
                  <div className="mt-1 inline-flex items-center gap-2 border-2 border-border bg-secondary/30 px-3 py-1 font-mono text-xs text-foreground">
                    <ChainBreakPixelIcon size={12} className="text-primary" />
                    {validator.flagsRaw}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-border bg-secondary/40 p-6 shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
              <h3 className="mb-4 flex items-center gap-2 font-display text-sm uppercase tracking-[0.12em] text-primary">
                <SparklePixelIcon size={14} className="text-primary" />
                Authorization Address
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Address</div>
                  <ExplorerLink
                    config={resolved}
                    type="address"
                    value={validator.authAddress}
                    className="mt-2 inline-flex items-center gap-2 break-all border-2 border-border bg-background/30 px-3 py-2 font-mono text-xs text-primary hover:border-primary"
                  >
                    {validator.authAddress}
                    <ChainBreakPixelIcon size={12} className="text-primary" />
                  </ExplorerLink>
                </div>
                <p className="font-display text-[9px] uppercase tracking-[0.12em] text-muted-foreground/80">
                  View on Monad explorer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Keys */}
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-lg uppercase tracking-[0.14em] text-primary">Keys</h2>
            <p className="text-[11px] tracking-[0.12em] text-muted-foreground/80">
              Public keys used for validation and signing
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="border-2 border-border bg-secondary/40 p-6 shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center border-2 border-primary bg-[#12092f]">
                  <CoinPixelIcon size={16} className="text-primary" />
                </span>
                <div>
                  <h3 className="font-display text-sm uppercase tracking-[0.12em] text-primary">SECP256K1</h3>
                  <p className="text-[10px] tracking-[0.1em] text-muted-foreground">Ethereum-compatible key</p>
                </div>
              </div>
              <div className="border-2 border-border bg-background/40 p-3">
                <div className="break-all font-mono text-xs leading-relaxed text-foreground/80">
                  {validator.keys.secpPubkey}
                </div>
              </div>
            </div>

            <div className="border-2 border-border bg-secondary/40 p-6 shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center border-2 border-accent bg-[#14092f]">
                  <ChestPixelIcon size={16} className="text-accent" />
                </span>
                <div>
                  <h3 className="font-display text-sm uppercase tracking-[0.12em] text-accent">BLS</h3>
                  <p className="text-[10px] tracking-[0.1em] text-muted-foreground">Signature aggregation key</p>
                </div>
              </div>
              <div className="border-2 border-border bg-background/40 p-3">
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
