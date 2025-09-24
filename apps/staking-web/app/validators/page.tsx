import type { MonadNetwork } from '@monad-staking/config';
import { MONAD_NETWORK_KEYS } from '@monad-staking/config';
import { NetworkSelector } from '@/app/components/network-selector';
import { PaginationControls } from '@/app/components/pagination-controls';
import { ValidatorTable } from '@/app/components/validator-table';
import { ValidatorViewSelector } from '@/app/components/validator-view-selector';
import {
  getValidatorSetPage,
  resolveViewParam,
  type ValidatorSetView,
  parseNetworkKey,
} from '@/lib/validators';
import { getNetworkConfigMap, getEnabledNetworkConfigs } from '@/lib/networks';

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>> |
    Record<string, string | string[] | undefined>;
}

async function resolveSearchParams(
  searchParams: PageProps['searchParams'],
): Promise<Record<string, string | string[] | undefined>> {
  if (!searchParams) return {};
  return searchParams instanceof Promise ? await searchParams : searchParams;
}

function normalizeCursor(param: string | undefined): number {
  if (!param) return 0;
  const parsed = Number.parseInt(param, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export default async function ValidatorsPage(props: PageProps) {
  const searchParams = await resolveSearchParams(props.searchParams);

  const configMap = getNetworkConfigMap();
  const enabledNetworks = getEnabledNetworkConfigs(configMap);

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

  const networkParam = searchParams['network'];
  const requestedNetwork = Array.isArray(networkParam)
    ? parseNetworkKey(networkParam[0])
    : parseNetworkKey(networkParam);

  const selectedNetwork = (requestedNetwork ?? enabledNetworks[0]?.key) as
    | MonadNetwork
    | undefined;

  const viewParam = searchParams['view'];
  const selectedView = resolveViewParam(
    Array.isArray(viewParam) ? viewParam[0] : viewParam,
  ) as ValidatorSetView;

  const cursorParam = searchParams['cursor'];
  const cursor = normalizeCursor(
    Array.isArray(cursorParam) ? cursorParam[0] : cursorParam,
  );

  if (!selectedNetwork) {
    return null;
  }

  let pageData;
  let error: string | null = null;

  try {
    pageData = await getValidatorSetPage(selectedNetwork, selectedView, cursor);
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : 'Failed to load validator information.';
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Validator Explorer</h1>
            <p className="text-slate-400">
              Inspect execution, consensus, and snapshot validator views for
              the selected Monad network.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <NetworkSelector
              networks={enabledNetworks}
              selectedKey={selectedNetwork}
            />
            <ValidatorViewSelector selected={selectedView} />
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-6 text-sm text-red-200">
          {error}
        </div>
      ) : pageData ? (
        <div className="space-y-4">
          <ValidatorTable validators={pageData.validators} />
          <PaginationControls
            prevCursor={pageData.prevCursor}
            nextCursor={pageData.nextCursor}
          />
        </div>
      ) : null}
    </div>
  );
}
