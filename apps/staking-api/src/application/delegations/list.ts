import type { BlockchainClient } from '../../infrastructure/blockchain/sdk.client';
import type { CacheService } from '../../infrastructure/cache/cache.service';
import type { Network } from '../../domain/types';
import { normalizeAmount } from '../../lib/format';

export interface ListDelegationsInput {
  network: Network;
  address: `0x${string}`;
  cursor: bigint;
}

export interface ListDelegationsOutput {
  items: Array<{
    validatorId: string;
    stake: { raw: string; decimal: string };
    unclaimedRewards: { raw: string; decimal: string };
    deltaStake: { raw: string; decimal: string };
    nextDeltaStake: { raw: string; decimal: string };
    deltaEpoch: string;
    nextDeltaEpoch: string;
  }>;
  cursor: { next: string; done: boolean };
}

export class ListDelegationsUseCase {
  constructor(
    private blockchainClient: BlockchainClient,
    private cache: CacheService,
  ) {}

  async execute(input: ListDelegationsInput): Promise<ListDelegationsOutput> {
    const cacheKey = `delegations:${input.network}:${input.address}:${input.cursor.toString()}`;
    const cached = await this.cache.get<ListDelegationsOutput>(cacheKey);
    if (cached) return cached;

    const page = await this.blockchainClient.getDelegations(input.address, input.cursor);
    const details = await Promise.all(
      page.items.map((delegation) =>
        this.blockchainClient.getDelegator(delegation.validatorId, input.address),
      ),
    );

    const output: ListDelegationsOutput = {
      items: details.map((d) => ({
        validatorId: d.validatorId.toString(),
        stake: normalizeAmount(d.stake),
        unclaimedRewards: normalizeAmount(d.unclaimedRewards),
        deltaStake: normalizeAmount(d.deltaStake),
        nextDeltaStake: normalizeAmount(d.nextDeltaStake),
        deltaEpoch: d.deltaEpoch.toString(),
        nextDeltaEpoch: d.nextDeltaEpoch.toString(),
      })),
      cursor: { next: page.nextCursor.toString(), done: page.isDone },
    };

    await this.cache.set(cacheKey, output);
    return output;
  }
}
