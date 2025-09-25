'use client';

import { useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { createMonadStakingSdk } from '@monad-staking/sdk';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';

export function useStakingSdk(network: ResolvedMonadNetworkConfig) {
  const publicClient = usePublicClient({ chainId: network.chainId });
  const { data: walletClient } = useWalletClient({ chainId: network.chainId });

  return useMemo(() => {
    if (!publicClient) return null;

    return createMonadStakingSdk({
      network,
      publicClient,
      walletClient: walletClient ?? undefined,
    });
  }, [network, publicClient, walletClient]);
}
