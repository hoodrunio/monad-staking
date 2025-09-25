import { z } from 'zod';

export const MONAD_STAKING_PRECOMPILE_ADDRESS =
  '0x0000000000000000000000000000000000001000' as const;

export const MONAD_NETWORK_KEYS = [
  'monad-mainnet',
  'monad-testnet-1',
  'monad-testnet-2',
] as const;

export type MonadNetwork = (typeof MONAD_NETWORK_KEYS)[number];

const epochParameters: Record<MonadNetwork, { epochLength: number; epochDelayPeriod: number }> = {
  'monad-mainnet': {
    epochLength: 50_000,
    epochDelayPeriod: 5_000,
  },
  'monad-testnet-1': {
    epochLength: 50_000,
    epochDelayPeriod: 5_000,
  },
  'monad-testnet-2': {
    epochLength: 5_000,
    epochDelayPeriod: 500,
  },
};

const withdrawalDelayEpochs = 1;

const envSchema = z.object({
  // Server-only envs
  MONAD_MAINNET_CHAIN_ID: z.coerce.number().int().positive().optional(),
  MONAD_MAINNET_RPC_URL: z.string().url().optional(),
  MONAD_MAINNET_EXPLORER_URL: z.string().url().optional(),
  MONAD_TESTNET_1_CHAIN_ID: z.coerce.number().int().positive().optional(),
  MONAD_TESTNET_1_RPC_URL: z.string().url().optional(),
  MONAD_TESTNET_1_EXPLORER_URL: z.string().url().optional(),
  MONAD_TESTNET_2_CHAIN_ID: z.coerce.number().int().positive().optional(),
  MONAD_TESTNET_2_RPC_URL: z.string().url().optional(),
  MONAD_TESTNET_2_EXPLORER_URL: z.string().url().optional(),

  // Public (browser-exposed) envs for Next.js client bundles
  NEXT_PUBLIC_MONAD_MAINNET_CHAIN_ID: z
    .coerce
    .number()
    .int()
    .positive()
    .optional(),
  NEXT_PUBLIC_MONAD_MAINNET_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_MONAD_MAINNET_EXPLORER_URL: z.string().url().optional(),

  NEXT_PUBLIC_MONAD_TESTNET_1_CHAIN_ID: z
    .coerce
    .number()
    .int()
    .positive()
    .optional(),
  NEXT_PUBLIC_MONAD_TESTNET_1_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_MONAD_TESTNET_1_EXPLORER_URL: z.string().url().optional(),

  NEXT_PUBLIC_MONAD_TESTNET_2_CHAIN_ID: z
    .coerce
    .number()
    .int()
    .positive()
    .optional(),
  NEXT_PUBLIC_MONAD_TESTNET_2_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_MONAD_TESTNET_2_EXPLORER_URL: z.string().url().optional(),
});

export interface MonadNetworkConfig {
  readonly key: MonadNetwork;
  readonly label: string;
  readonly chainId?: number;
  readonly rpcUrl?: string;
  readonly explorerBaseUrl?: string;
  readonly epochLength: number;
  readonly epochDelayPeriod: number;
  readonly withdrawalDelay: number;
  readonly precompileAddress: typeof MONAD_STAKING_PRECOMPILE_ADDRESS;
  readonly enabled: boolean;
}

export type ResolvedMonadNetworkConfig = MonadNetworkConfig & {
  readonly chainId: number;
  readonly rpcUrl: string;
  readonly enabled: true;
};

const labels: Record<MonadNetwork, string> = {
  'monad-mainnet': 'Monad Mainnet',
  'monad-testnet-1': 'Monad Testnet-1',
  'monad-testnet-2': 'Monad Testnet-2',
};

export type MonadNetworkConfigMap = Record<MonadNetwork, MonadNetworkConfig>;

export function loadMonadNetworkConfig(
  sourceEnv: NodeJS.ProcessEnv = process.env,
): MonadNetworkConfigMap {
  // Merge server and public envs. Use direct dotted access for NEXT_PUBLIC_* so Next.js
  // replaces them in the client bundle. sourceEnv is kept for SSR/tests.
  const mergedEnv = {
    // Mainnet
    MONAD_MAINNET_CHAIN_ID:
      sourceEnv.MONAD_MAINNET_CHAIN_ID ?? process.env.MONAD_MAINNET_CHAIN_ID ?? process.env.NEXT_PUBLIC_MONAD_MAINNET_CHAIN_ID,
    MONAD_MAINNET_RPC_URL:
      sourceEnv.MONAD_MAINNET_RPC_URL ?? process.env.MONAD_MAINNET_RPC_URL ?? process.env.NEXT_PUBLIC_MONAD_MAINNET_RPC_URL,
    MONAD_MAINNET_EXPLORER_URL:
      sourceEnv.MONAD_MAINNET_EXPLORER_URL ?? process.env.MONAD_MAINNET_EXPLORER_URL ?? process.env.NEXT_PUBLIC_MONAD_MAINNET_EXPLORER_URL,

    // Testnet-1
    MONAD_TESTNET_1_CHAIN_ID:
      sourceEnv.MONAD_TESTNET_1_CHAIN_ID ?? process.env.MONAD_TESTNET_1_CHAIN_ID ?? process.env.NEXT_PUBLIC_MONAD_TESTNET_1_CHAIN_ID,
    MONAD_TESTNET_1_RPC_URL:
      sourceEnv.MONAD_TESTNET_1_RPC_URL ?? process.env.MONAD_TESTNET_1_RPC_URL ?? process.env.NEXT_PUBLIC_MONAD_TESTNET_1_RPC_URL,
    MONAD_TESTNET_1_EXPLORER_URL:
      sourceEnv.MONAD_TESTNET_1_EXPLORER_URL ?? process.env.MONAD_TESTNET_1_EXPLORER_URL ?? process.env.NEXT_PUBLIC_MONAD_TESTNET_1_EXPLORER_URL,

    // Testnet-2
    MONAD_TESTNET_2_CHAIN_ID:
      sourceEnv.MONAD_TESTNET_2_CHAIN_ID ?? process.env.MONAD_TESTNET_2_CHAIN_ID ?? process.env.NEXT_PUBLIC_MONAD_TESTNET_2_CHAIN_ID,
    MONAD_TESTNET_2_RPC_URL:
      sourceEnv.MONAD_TESTNET_2_RPC_URL ?? process.env.MONAD_TESTNET_2_RPC_URL ?? process.env.NEXT_PUBLIC_MONAD_TESTNET_2_RPC_URL,
    MONAD_TESTNET_2_EXPLORER_URL:
      sourceEnv.MONAD_TESTNET_2_EXPLORER_URL ?? process.env.MONAD_TESTNET_2_EXPLORER_URL ?? process.env.NEXT_PUBLIC_MONAD_TESTNET_2_EXPLORER_URL,
  } as NodeJS.ProcessEnv;

  const env = envSchema.parse(mergedEnv);

  const configs = MONAD_NETWORK_KEYS.map((key): MonadNetworkConfig => {
    const label = labels[key];
    const { epochLength, epochDelayPeriod } = epochParameters[key];

    switch (key) {
      case 'monad-mainnet': {
        const chainId = env.MONAD_MAINNET_CHAIN_ID ?? env.NEXT_PUBLIC_MONAD_MAINNET_CHAIN_ID;
        const rpcUrl = env.MONAD_MAINNET_RPC_URL ?? env.NEXT_PUBLIC_MONAD_MAINNET_RPC_URL;
        return {
          key,
          label,
          chainId,
          rpcUrl,
          explorerBaseUrl: env.MONAD_MAINNET_EXPLORER_URL ?? env.NEXT_PUBLIC_MONAD_MAINNET_EXPLORER_URL,
          epochLength,
          epochDelayPeriod,
          withdrawalDelay: withdrawalDelayEpochs,
          precompileAddress: MONAD_STAKING_PRECOMPILE_ADDRESS,
          enabled: Boolean(chainId && rpcUrl),
        };
      }
      case 'monad-testnet-1': {
        const chainId = env.MONAD_TESTNET_1_CHAIN_ID ?? env.NEXT_PUBLIC_MONAD_TESTNET_1_CHAIN_ID;
        const rpcUrl = env.MONAD_TESTNET_1_RPC_URL ?? env.NEXT_PUBLIC_MONAD_TESTNET_1_RPC_URL;
        return {
          key,
          label,
          chainId,
          rpcUrl,
          explorerBaseUrl: env.MONAD_TESTNET_1_EXPLORER_URL ?? env.NEXT_PUBLIC_MONAD_TESTNET_1_EXPLORER_URL,
          epochLength,
          epochDelayPeriod,
          withdrawalDelay: withdrawalDelayEpochs,
          precompileAddress: MONAD_STAKING_PRECOMPILE_ADDRESS,
          enabled: Boolean(chainId && rpcUrl),
        };
      }
      case 'monad-testnet-2': {
        const chainId = env.MONAD_TESTNET_2_CHAIN_ID ?? env.NEXT_PUBLIC_MONAD_TESTNET_2_CHAIN_ID;
        const rpcUrl = env.MONAD_TESTNET_2_RPC_URL ?? env.NEXT_PUBLIC_MONAD_TESTNET_2_RPC_URL;
        return {
          key,
          label,
          chainId,
          rpcUrl,
          explorerBaseUrl: env.MONAD_TESTNET_2_EXPLORER_URL ?? env.NEXT_PUBLIC_MONAD_TESTNET_2_EXPLORER_URL,
          epochLength,
          epochDelayPeriod,
          withdrawalDelay: withdrawalDelayEpochs,
          precompileAddress: MONAD_STAKING_PRECOMPILE_ADDRESS,
          enabled: Boolean(chainId && rpcUrl),
        };
      }
      default: {
        const exhaustiveCheck: never = key;
        throw new Error(`Unsupported network key: ${exhaustiveCheck}`);
      }
    }
  });

  return configs.reduce<MonadNetworkConfigMap>((acc, config) => {
    acc[config.key] = config;
    return acc;
  }, {} as MonadNetworkConfigMap);
}

export function getEnabledNetworks(
  configMap: MonadNetworkConfigMap,
): MonadNetworkConfig[] {
  return MONAD_NETWORK_KEYS.map((key) => configMap[key]).filter(
    (config) => config.enabled,
  );
}

export function requireNetworkConfig(
  configMap: MonadNetworkConfigMap,
  key: MonadNetwork,
): ResolvedMonadNetworkConfig {
  const config = configMap[key];
  if (!config.enabled || !config.chainId || !config.rpcUrl) {
    throw new Error(
      `Network ${key} is not fully configured. Ensure chain ID and RPC URL environment variables are set.`,
    );
  }

  return {
    ...config,
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    enabled: true,
  };
}

export const REQUIRED_ENVIRONMENT_VARIABLES = [
  'MONAD_MAINNET_CHAIN_ID',
  'MONAD_MAINNET_RPC_URL',
  'MONAD_TESTNET_1_CHAIN_ID',
  'MONAD_TESTNET_1_RPC_URL',
  'MONAD_TESTNET_2_CHAIN_ID',
  'MONAD_TESTNET_2_RPC_URL',
] as const;
