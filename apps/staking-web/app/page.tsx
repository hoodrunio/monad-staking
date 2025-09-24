import type { MonadNetwork } from '@monad-staking/config';
import { MONAD_NETWORK_KEYS } from '@monad-staking/config';
import type { EpochInfo } from '@monad-staking/sdk';
import { NetworkSelector } from '@/app/components/network-selector';
import {
  getEnabledNetworkConfigs,
  getNetworkConfigMap,
  parseNetworkKey,
  tryResolveNetwork,
} from '@/lib/networks';
import { getStakingSdk } from '@/lib/clients';

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>> |
    Record<string, string | string[] | undefined>;
}

async function resolveSearchParams(
  searchParams: PageProps['searchParams'],
): Promise<Record<string, string | string[] | undefined>> {
  if (!searchParams) return {};
  if (searchParams instanceof Promise) {
    return searchParams;
  }
  return searchParams;
}

async function fetchEpoch(
  networkKey: MonadNetwork,
): Promise<{ info: EpochInfo | null; error?: string }> {
  const configMap = getNetworkConfigMap();
  const resolved = tryResolveNetwork(configMap, networkKey);
  if (!resolved) {
    return { info: null, error: 'Network is not fully configured.' };
  }

  try {
    const sdk = getStakingSdk(resolved);
    const info = await sdk.getEpoch();
    return { info };
  } catch (error) {
    let message = 'Failed to fetch epoch data.';
    if (error instanceof Error) {
      message = `${message} ${error.message}`;
    }
    return { info: null, error: message };
  }
}

export default async function Page(props: PageProps) {
  const searchParams = await resolveSearchParams(props.searchParams);
  const configMap = getNetworkConfigMap();
  const enabledNetworks = getEnabledNetworkConfigs(configMap);

  if (enabledNetworks.length === 0) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Monad Staking Dashboard</h1>
          <p className="text-slate-400">
            Configure environment variables for at least one network to begin.
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
          <p className="mt-4 text-sm text-slate-500">
            Refer to <code className="rounded bg-slate-800 px-2 py-1">AGENTS.md</code>{' '}
            in the repository root for additional guidance.
          </p>
        </section>
      </div>
    );
  }

  const networkParam = searchParams['network'];
  const requestedKey = Array.isArray(networkParam)
    ? parseNetworkKey(networkParam[0])
    : parseNetworkKey(networkParam);

  const fallbackKey = enabledNetworks[0]?.key;
  const selectedKey = requestedKey ?? fallbackKey;

  if (!selectedKey) {
    return null;
  }

  const epochResult = await fetchEpoch(selectedKey);

  const selectedConfig = configMap[selectedKey];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Monad Staking Dashboard</h1>
          <p className="text-slate-400">
            Track epoch progress and validator activation timelines across Monad
            networks.
          </p>
        </div>
        <NetworkSelector
          networks={enabledNetworks}
          selectedKey={selectedKey}
        />
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-black/10">
          <h2 className="text-xl font-semibold text-slate-100">
            Epoch Overview
          </h2>
          {epochResult.info ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Current Epoch</dt>
                <dd className="font-mono text-base text-slate-50">
                  {epochResult.info.epoch.toString()}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Epoch Delay Period</dt>
                <dd className="font-mono text-base text-slate-50">
                  {epochResult.info.inEpochDelayPeriod ? 'Active' : 'Inactive'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Blocks per Epoch</dt>
                <dd className="font-mono text-base text-slate-50">
                  {selectedConfig.epochLength.toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Rounds in Delay Period</dt>
                <dd className="font-mono text-base text-slate-50">
                  {selectedConfig.epochDelayPeriod.toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Withdrawal Delay</dt>
                <dd className="font-mono text-base text-slate-50">
                  {selectedConfig.withdrawalDelay} epoch
                  {selectedConfig.withdrawalDelay === 1 ? '' : 's'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-red-400">
              {epochResult.error ?? 'Unable to load epoch information.'}
            </p>
          )}
        </article>

        <article className="rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-6">
          <h2 className="text-xl font-semibold text-emerald-200">
            Activation Windows
          </h2>
          <p className="mt-3 text-sm text-emerald-100/80">
            Delegations submitted before the boundary block activate in the next
            epoch. Requests within the delay window activate two epochs later.
            Withdrawals settle after an additional{' '}
            {selectedConfig.withdrawalDelay} epoch.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-emerald-100/70">
            <li>
              <span className="font-semibold">Delegation:</span> Effective in
              epoch <code>n + 1</code> or <code>n + 2</code> depending on timing.
            </li>
            <li>
              <span className="font-semibold">Undelegation:</span> Leaves the
              active set in the same cadence and becomes withdrawable after the
              configured delay.
            </li>
            <li>
              <span className="font-semibold">Rewards:</span> Claim directly or
              call <code>compound</code> to roll them into stake.
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
