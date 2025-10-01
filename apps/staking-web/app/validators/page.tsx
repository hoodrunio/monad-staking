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
import { cn } from '@/lib/utils';
import { ShellSection } from '@/app/components/layout/shell';

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
        <Card>
          <CardHeader className="gap-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-3xl sm:text-4xl">Validators</CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Browse validator performance on {resolved.label}. Toggle filters to focus on active operators.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex overflow-hidden rounded-lg border border-border bg-muted/30 p-1 text-xs font-medium">
                <button
                  type="button"
                  className={cn(
                    'rounded-md px-3 py-1.5 transition-all',
                    showActiveOnly
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setShowActiveOnly(true)}
                >
                  Active only
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-md px-3 py-1.5 transition-all',
                    !showActiveOnly
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setShowActiveOnly(false)}
                >
                  All validators
                </button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </ShellSection>

      <ShellSection as="section" className="space-y-7" width="wide">
        {error ? (
          <Card className="text-destructive-foreground">
            <CardHeader>
              <CardTitle>Unable to load validators</CardTitle>
              <CardDescription className="text-destructive-foreground/80">
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
