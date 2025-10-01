import type { PublicClient, Transport, WalletClient } from 'viem';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';

export interface MonadStakingSdkOptions<TTransport extends Transport> {
  readonly network: ResolvedMonadNetworkConfig;
  readonly publicClient: PublicClient<TTransport>;
  readonly walletClient?: WalletClient<TTransport>;
}
