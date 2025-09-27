'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowTopRightOnSquareIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { getSelectedNetwork } from '@/lib/page-utils';
import { NetworkSelector } from '@/app/components/network-selector';
import { LoadingSkeleton } from '@/app/components/loading-skeleton';
import { ClientOnly } from '@/app/components/client-only';
import { useEpochQuery } from '@/lib/queries';
import { MONAD_NETWORK_KEYS } from '@monad-staking/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

function formatEpochStatus(inDelay: boolean): { label: string; tone: string } {
  return inDelay
    ? { label: 'Delay period', tone: 'text-amber-300 bg-amber-500/10 border-amber-400/30' }
    : { label: 'Active', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30' };
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabledNetworks = useMemo(() => getEnabledNetworkConfigs(configMap), [configMap]);

  const selectedNetwork = getSelectedNetwork(searchParams.get('network'), enabledNetworks);
  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;

  const { data: epochData, isLoading, error } = useEpochQuery(selectedNetwork || 'monad-mainnet', {
    enabled: Boolean(selectedNetwork && resolved),
  });

  if (enabledNetworks.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <Card className="border-dashed border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl">Configure a Monad network</CardTitle>
            <CardDescription>
              Add RPC URLs and chain IDs to your environment to unlock the dashboard experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              {MONAD_NETWORK_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs text-muted-foreground"
                >
                  <span>{key.toUpperCase().replace(/-/g, '_')}_RPC_URL</span>
                  <span>{key.toUpperCase().replace(/-/g, '_')}_CHAIN_ID</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Tip: update <code>.env.local</code> and restart the dev server to refresh configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedNetwork || !resolved) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network not ready</CardTitle>
          <CardDescription>Selected network is missing configuration. Double-check your environment setup.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const status = epochData ? formatEpochStatus(epochData.inEpochDelayPeriod) : null;
  const nextActivationEpoch = epochData
    ? (BigInt(epochData.epoch) + (epochData.inEpochDelayPeriod ? 2n : 1n)).toString()
    : null;
  const withdrawableEpoch = epochData
    ? (BigInt(epochData.epoch) + (epochData.inEpochDelayPeriod ? 2n : 1n) + BigInt(epochData.withdrawalDelay)).toString()
    : null;

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-monad-grid opacity-60" />
          <CardHeader className="relative z-10 gap-6">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                Live network insights
              </div>
              <CardTitle className="text-3xl leading-tight">
                {resolved.label}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Monitor epochs, validator performance, and activation windows for {resolved.label}. Use network filters to pivot across Monad deployments.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Active network</span>
                <span className="text-sm font-semibold text-foreground">{resolved.label}</span>
              </div>
              <NetworkSelector networks={enabledNetworks} selectedKey={selectedNetwork} />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Network endpoints</span>
              <CloudArrowUpIcon className="h-5 w-5 text-primary" />
            </CardTitle>
            <CardDescription>
              RPC connectivity details for the selected network.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <dl className="space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide">RPC URL</dt>
                <dd className="mt-1 break-words rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-foreground/80">
                  {resolved.rpcUrl}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide">Chain ID</dt>
                  <dd className="mt-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-foreground">
                    {resolved.chainId}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide">Epoch length</dt>
                  <dd className="mt-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-foreground">
                    {resolved.epochLength.toLocaleString()} blocks
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Explorer</dt>
                <dd className="mt-1 inline-flex items-center gap-2 text-foreground">
                  {resolved.explorerBaseUrl ? (
                    <a
                      href={resolved.explorerBaseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground transition hover:border-primary/40 hover:text-primary-foreground"
                    >
                      Visit explorer
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Not configured
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Epoch overview</h2>
            <p className="text-sm text-muted-foreground">
              Live epoch metrics and staking parameters for {resolved.label}.
            </p>
          </div>
        </div>

        {error ? (
          <Card className="border border-destructive/40 bg-destructive/10 text-destructive-foreground">
            <CardHeader>
              <CardTitle>Failed to load epoch information</CardTitle>
              <CardDescription className="text-destructive-foreground/80">
                {error instanceof Error ? error.message : 'Unknown error occurred while fetching epoch data.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border border-white/5 bg-white/5">
                <CardContent>
                  <LoadingSkeleton className="mb-2 h-3 w-20 rounded-full bg-white/10" />
                  <LoadingSkeleton className="h-8 w-24 rounded-full bg-white/10" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : epochData ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current epoch</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{epochData.epoch}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Epoch status</p>
                <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${status?.tone ?? ''}`}>
                  {status?.label ?? 'Unknown'}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Epoch length</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {epochData.epochLength.toLocaleString()} <span className="text-base font-normal text-muted-foreground">blocks</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Withdrawal delay</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {epochData.withdrawalDelay} <span className="text-base font-normal text-muted-foreground">epochs</span>
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activation windows</CardTitle>
            <CardDescription>
              Understand when delegation changes take effect relative to the current epoch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {epochData ? (
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Delegations active</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">Epoch {nextActivationEpoch}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Undelegations inactive</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">Epoch {nextActivationEpoch}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Withdrawals available</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">Epoch {withdrawableEpoch}</p>
                </div>
              </div>
            ) : (
              <LoadingSkeleton className="h-24 w-full rounded-2xl bg-white/10" />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <ClientOnly
      fallback={
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold">Monad Staking Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <HomePageContent />
    </ClientOnly>
  );
}
