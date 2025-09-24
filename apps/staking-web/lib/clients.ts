import { cache } from 'react';
import { defineChain, createPublicClient, http } from 'viem';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import { createMonadStakingSdk } from '@monad-staking/sdk';

const createChain = (config: ResolvedMonadNetworkConfig) =>
  defineChain({
    id: config.chainId,
    name: config.label,
    network: config.key,
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MON',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [config.rpcUrl] },
      public: { http: [config.rpcUrl] },
    },
    blockExplorers: config.explorerBaseUrl
      ? {
          default: {
            name: `${config.label} Explorer`,
            url: config.explorerBaseUrl,
          },
        }
      : undefined,
  });

export const getPublicClient = cache((config: ResolvedMonadNetworkConfig) => {
  const chain = createChain(config);
  return createPublicClient({
    chain,
    transport: http(config.rpcUrl, {
      fetchOptions: {
        cache: 'no-store',
      },
    }),
  });
});

export const getStakingSdk = cache((config: ResolvedMonadNetworkConfig) => {
  const publicClient = getPublicClient(config);
  return createMonadStakingSdk({
    network: config,
    publicClient,
  });
});
