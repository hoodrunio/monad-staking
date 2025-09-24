import { cache } from 'react';
import {
  MONAD_NETWORK_KEYS,
  type MonadNetwork,
  type MonadNetworkConfig,
  type MonadNetworkConfigMap,
  type ResolvedMonadNetworkConfig,
} from '@monad-staking/config';
import {
  loadMonadNetworks,
  resolveMonadNetwork,
} from '@monad-staking/sdk';

export const getNetworkConfigMap = cache((): MonadNetworkConfigMap => {
  return loadMonadNetworks();
});

export function getEnabledNetworkConfigs(
  configMap: MonadNetworkConfigMap,
): MonadNetworkConfig[] {
  return MONAD_NETWORK_KEYS.map((key) => configMap[key]).filter(
    (config) => config.enabled,
  );
}

export function parseNetworkKey(value: string | undefined): MonadNetwork | null {
  if (!value) return null;
  return MONAD_NETWORK_KEYS.includes(value as MonadNetwork)
    ? (value as MonadNetwork)
    : null;
}

export function tryResolveNetwork(
  configMap: MonadNetworkConfigMap,
  key: MonadNetwork,
): ResolvedMonadNetworkConfig | null {
  try {
    return resolveMonadNetwork(configMap, key);
  } catch (error) {
    console.error(`Failed to resolve network ${key}`, error);
    return null;
  }
}
