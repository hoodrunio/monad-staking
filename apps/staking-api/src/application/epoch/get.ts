import type { BlockchainClient } from '../../infrastructure/blockchain/sdk.client';
import type { CacheService } from '../../infrastructure/cache/cache.service';
import type { Network } from '../../domain/types';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';

export interface GetEpochInput {
  network: Network;
  networkConfig: ResolvedMonadNetworkConfig;
}

export interface GetEpochOutput {
  epoch: string;
  inEpochDelayPeriod: boolean;
  epochLength: number;
  epochDelayPeriod: number;
  withdrawalDelay: number;
}

export class GetEpochUseCase {
  constructor(
    private blockchainClient: BlockchainClient,
    private cache: CacheService,
  ) {}

  async execute(input: GetEpochInput): Promise<GetEpochOutput> {
    const cacheKey = `epoch:${input.network}`;
    const cached = await this.cache.get<GetEpochOutput>(cacheKey);
    if (cached) return cached;

    const info = await this.blockchainClient.getEpoch();
    const output: GetEpochOutput = {
      epoch: info.epoch.toString(),
      inEpochDelayPeriod: info.inEpochDelayPeriod,
      epochLength: input.networkConfig.epochLength,
      epochDelayPeriod: input.networkConfig.epochDelayPeriod,
      withdrawalDelay: input.networkConfig.withdrawalDelay,
    };

    await this.cache.set(cacheKey, output);
    return output;
  }
}
