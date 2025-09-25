import type { MonadNetwork } from '@monad-staking/config';
import { parseNetworkKey } from './validators';

export function getSelectedNetwork(
  networkParam: string | null | undefined,
  enabledNetworks: Array<{ key: MonadNetwork }>
): MonadNetwork | undefined {
  const requestedNetwork = parseNetworkKey(networkParam ?? undefined);
  return (requestedNetwork ?? enabledNetworks[0]?.key) as MonadNetwork | undefined;
}

export function normalizeSearchParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    return param[0] || undefined;
  }
  return param;
}
