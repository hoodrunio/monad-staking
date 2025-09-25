import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';
import {
  MONAD_NETWORK_KEYS,
  loadMonadNetworkConfig,
  requireNetworkConfig,
  type MonadNetwork,
  type ResolvedMonadNetworkConfig,
} from '@monad-staking/config';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error(
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required for wallet connectivity.',
  );
}

const networkConfigMap = loadMonadNetworkConfig();

const resolvedNetworks: ResolvedMonadNetworkConfig[] = MONAD_NETWORK_KEYS.flatMap(
  (key) => {
    try {
      return [requireNetworkConfig(networkConfigMap, key as MonadNetwork)];
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Skipping wallet chain for ${key}: ${String(error)}`);
      }
      return [];
    }
  },
);

if (resolvedNetworks.length === 0) {
  throw new Error(
    'No Monad networks are fully configured. Set RPC URLs and chain IDs to enable wallet connectivity.',
  );
}

export const chains = resolvedNetworks.map((config) =>
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
  }),
);

const transports = resolvedNetworks.reduce(
  (acc, config) => {
    acc[config.chainId] = http(config.rpcUrl);
    return acc;
  },
  {} as Record<number, ReturnType<typeof http>>,
);

export const wagmiConfig = getDefaultConfig({
  appName: 'Monad Staking dApp',
  projectId,
  chains,
  transports,
  ssr: true,
});

export const resolvedNetworkMap = resolvedNetworks.reduce(
  (acc, config) => {
    acc[config.key] = config;
    return acc;
  },
  {} as Record<MonadNetwork, ResolvedMonadNetworkConfig>,
);
