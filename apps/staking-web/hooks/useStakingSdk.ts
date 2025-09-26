'use client';

import { useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { createMonadStakingSdk } from '@monad-staking/sdk';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';

export function useStakingSdk(network: ResolvedMonadNetworkConfig | null | undefined) {
  const chainId = network?.chainId;
  const publicClient = usePublicClient(chainId ? { chainId } : undefined);
  const { data: walletClient } = useWalletClient(chainId ? { chainId } : undefined);

  return useMemo(() => {
    if (!network || !publicClient) return null;

    return createMonadStakingSdk({
      network,
      publicClient,
      walletClient: walletClient ?? undefined,
    });
  }, [network, publicClient, walletClient]);
}
