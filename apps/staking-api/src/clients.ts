import { createPublicClient, defineChain, http, type PublicClient, type Transport, type Chain } from 'viem';
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

const publicClientCache = new Map<number, PublicClient<Transport, Chain, undefined>>();
const sdkCache = new Map<number, ReturnType<typeof createMonadStakingSdk>>();

export function getPublicClient(config: ResolvedMonadNetworkConfig) {
  const key = config.chainId;
  const existing = publicClientCache.get(key);
  if (existing) return existing;
  const chain = createChain(config);
  const client = createPublicClient<Transport, Chain, undefined>({
    chain,
    transport: http(config.rpcUrl),
  });
  publicClientCache.set(key, client);
  return client;
}

export function getSdk(config: ResolvedMonadNetworkConfig) {
  const key = config.chainId;
  const existing = sdkCache.get(key);
  if (existing) return existing;
  const publicClient = getPublicClient(config);
  const sdk = createMonadStakingSdk({ network: config, publicClient });
  sdkCache.set(key, sdk);
  return sdk;
}


