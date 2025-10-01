import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';

export function assertSameChain(
  config: ResolvedMonadNetworkConfig,
  clientChainId?: number,
  clientType?: 'public' | 'wallet',
): void {
  if (!clientChainId) return;
  if (clientChainId !== config.chainId) {
    const origin = clientType ? `${clientType} client` : 'client';
    throw new Error(
      `${origin} (chainId=${clientChainId}) does not match configured Monad network (chainId=${config.chainId}).`,
    );
  }
}
