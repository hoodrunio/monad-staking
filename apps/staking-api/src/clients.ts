import { cache } from 'react';
import { createPublicClient, defineChain, http } from 'viem';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import {
  loadMonadNetworkConfig,
  MONAD_NETWORK_KEYS,
  requireNetworkConfig,
  type MonadNetwork,
} from '@monad-staking/config';
import { createMonadStakingSdk } from '@monad-staking/sdk';

export function getResolvedNetworks(): Record<MonadNetwork, ResolvedMonadNetworkConfig> {
  const map = loadMonadNetworkConfig();
  const resolved: Partial<Record<MonadNetwork, ResolvedMonadNetworkConfig>> = {};
  for (const key of MONAD_NETWORK_KEYS) {
    try {
      resolved[key] = requireNetworkConfig(map, key);
    } catch {
      // skip unconfigured
    }
  }
  return resolved as Record<MonadNetwork, ResolvedMonadNetworkConfig>;
}

const createChain = (config: ResolvedMonadNetworkConfig) =>
  defineChain({
    id: config.chainId,
    name: config.label,
    network: config.key,
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: {
      default: { http: [config.rpcUrl] },
      public: { http: [config.rpcUrl] },
    },
  });

export const getPublicClient = cache((config: ResolvedMonadNetworkConfig) => {
  const chain = createChain(config);
  return createPublicClient({ chain, transport: http(config.rpcUrl) });
});

export const getSdk = cache((config: ResolvedMonadNetworkConfig) => {
  const publicClient = getPublicClient(config);
  return createMonadStakingSdk({ network: config, publicClient });
});


