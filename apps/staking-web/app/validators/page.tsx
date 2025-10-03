'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MONAD_NETWORK_KEYS } from '@monad-staking/config';
import { PaginationControls } from '@/app/components/pagination-controls';
import { ValidatorTable } from '@/app/components/validator-table';
import { ValidatorTableSkeleton } from '@/app/components/loading-skeleton';
import { ClientOnly } from '@/app/components/client-only';
import { useValidatorsQuery } from '@/lib/queries';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { normalizeCursor } from '@/lib/validators-utils';
import { formatCompactMonFromDecimal } from '@/lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ShellSection } from '@/app/components/layout/shell';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ChainBreakPixelIcon, KnightPixelIcon, SparklePixelIcon } from '@/app/components/icons';

function ValidatorsPageContent() {
  const searchParams = useSearchParams();
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabledNetworks = useMemo(() => getEnabledNetworkConfigs(configMap), [configMap]);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const selectedNetwork = getSelectedNetwork(searchParams.get('network'), enabledNetworks);
  const cursor = normalizeCursor(searchParams.get('cursor') ?? undefined);

  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;
  const { data: pageData, isLoading, error } = useValidatorsQuery(selectedNetwork || 'monad-mainnet', cursor, 50, {
    enabled: Boolean(selectedNetwork && resolved),
    filters: { activeOnly: showActiveOnly },
  });

  if (enabledNetworks.length === 0) {
    return (
      <ShellSection width="wide">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Validator list unavailable</CardTitle>
            <CardDescription>
              Provide at least one network RPC URL and chain ID to inspect validators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              {MONAD_NETWORK_KEYS.map((key) => (
                <div key={key} className="rounded-2xl px-4 py-3 font-mono text-xs text-muted-foreground">
                  <div>{key.toUpperCase().replace(/-/g, '_')}_RPC_URL</div>
                  <div>{key.toUpperCase().replace(/-/g, '_')}_CHAIN_ID</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </ShellSection>
    );
  }

  if (!selectedNetwork || !resolved) {
    return (
      <ShellSection width="wide">
        <Card>
          <CardHeader>
            <CardTitle>Network not ready</CardTitle>
            <CardDescription>Selected network is missing configuration. Update your environment variables and retry.</CardDescription>
          </CardHeader>
        </Card>
      </ShellSection>
    );
  }

  return (
    <>
      <ShellSection width="wide">
        <Card className="px-6 py-6">
          <CardHeader className="gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center border-2 border-primary bg-[#12092f] shadow-[4px_4px_0_rgba(0,0,0,0.55)]">
                  <KnightPixelIcon size={18} className="text-primary" />
                </span>
                <div className="flex flex-col gap-1">
                  <CardTitle className="font-display text-2xl uppercase tracking-[0.14em] text-primary">
                    Validators
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-base">
                    Browse validator performance on {resolved.label}. Toggle filters to focus on active operators.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="accent">{resolved.label}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={showActiveOnly ? 'accent' : 'outline'}
                onClick={() => setShowActiveOnly(true)}
              >
                Active only
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!showActiveOnly ? 'accent' : 'outline'}
                onClick={() => setShowActiveOnly(false)}
              >
                All validators
              </Button>
              <span className="inline-flex items-center gap-1 font-display text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <SparklePixelIcon size={14} className="text-primary" />
                {pageData?.items.length ?? 0} entries
              </span>
            </div>
          </CardHeader>
        </Card>
      </ShellSection>

      <ShellSection as="section" className="space-y-7" width="wide">
        {error ? (
          <Card className="border-2 border-destructive bg-secondary/40 text-destructive shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-3">
                <ChainBreakPixelIcon size={16} className="text-destructive" />
                <CardTitle className="font-display text-lg uppercase tracking-[0.14em] text-destructive">Unable to load validators</CardTitle>
              </div>
              <CardDescription className="text-sm tracking-[0.06em] text-destructive/80">
                {error instanceof Error ? error.message : 'Unknown error occurred while fetching validators.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : isLoading ? (
          <ValidatorTableSkeleton />
        ) : pageData ? (
          <div className="space-y-6">
            <ValidatorTable
              validators={pageData.items.map((item) => ({
                id: item.id,
                authAddress: item.authAddress,
                commission: item.commission.formatted,
                stake: formatCompactMonFromDecimal(item.stake.decimal),
                unclaimedRewards: formatCompactMonFromDecimal(item.unclaimedRewards.decimal),
                flagsRaw: item.flagsRaw,
                isActive: item.isActive,
              }))}
              networkConfig={resolved}
            />
            <PaginationControls prevCursor={pageData.cursor.prev} nextCursor={pageData.cursor.next} />
          </div>
        ) : null}
      </ShellSection>
    </>
  );
}

export default function ValidatorsPage() {
  return (
    <ClientOnly
      fallback={
        <ShellSection as="div" className="space-y-6" width="wide">
          <h1 className="text-3xl font-semibold">Validators</h1>
          <p className="text-muted-foreground">Loading...</p>
        </ShellSection>
      }
    >
      <ValidatorsPageContent />
    </ClientOnly>
  );
}
