import type { BlockchainClient } from '../../infrastructure/blockchain/sdk.client';
import type { CacheService } from '../../infrastructure/cache/cache.service';
import type { Network } from '../../domain/types';
import { normalizeAmount } from '../../lib/format';

export interface GetBalanceInput {
  network: Network;
  address: `0x${string}`;
}

export interface GetBalanceOutput {
  available: { raw: string; decimal: string };
  staked: { raw: string; decimal: string };
}

export class GetBalanceUseCase {
  constructor(
    private blockchainClient: BlockchainClient,
    private cache: CacheService,
  ) {}

  async execute(input: GetBalanceInput): Promise<GetBalanceOutput> {
    const cacheKey = `balance:${input.network}:${input.address}`;
    const cached = await this.cache.get<GetBalanceOutput>(cacheKey);
    if (cached) return cached;

    const walletBalance = await this.blockchainClient.getBalance(input.address);
    const delegations = await this.blockchainClient.getDelegations(input.address, 0n);

    let totalDelegated = 0n;
    for (const delegation of delegations.items) {
      const delegator = await this.blockchainClient.getDelegator(delegation.validatorId, input.address);
      totalDelegated += delegator.stake;
    }

    const output: GetBalanceOutput = {
      available: normalizeAmount(walletBalance),
      staked: normalizeAmount(totalDelegated),
    };

    await this.cache.set(cacheKey, output);
    return output;
  }
}
