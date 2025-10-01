import pLimit from 'p-limit';
import type { BlockchainClient } from '../../infrastructure/blockchain/sdk.client';
import type { CacheService } from '../../infrastructure/cache/cache.service';
import type { Network } from '../../domain/types';
import { normalizeAmount } from '../../lib/format';

export interface ListWithdrawalsInput {
  network: Network;
  address: `0x${string}`;
  validatorId?: bigint;
  startId: number;
  limit: number;
  stopAfterMisses: number;
}

export interface ListWithdrawalsOutput {
  items: Array<{
    validatorId: string;
    withdrawalId: number;
    amount: { raw: string; decimal: string };
    accRewardPerToken: { raw: string; decimal: string };
    withdrawEpoch: string;
  }>;
  nextStartId: number | null;
}

export class ListWithdrawalsUseCase {
  constructor(
    private blockchainClient: BlockchainClient,
    private cache: CacheService,
  ) {}

  async execute(input: ListWithdrawalsInput): Promise<ListWithdrawalsOutput> {
    const cacheKey = `withdrawals:${input.network}:${input.address}:${input.validatorId ?? 'all'}:${input.startId}:${input.limit}:${input.stopAfterMisses}`;
    const cached = await this.cache.get<ListWithdrawalsOutput>(cacheKey);
    if (cached) return cached;

    let validatorIds: bigint[] = [];
    if (input.validatorId) {
      validatorIds = [input.validatorId];
    } else {
      const delPage = await this.blockchainClient.getDelegations(input.address, 0n);
      validatorIds = delPage.items.map((d) => d.validatorId);
    }

    const limiter = pLimit(6);
    const results = await Promise.all(
      validatorIds.map((vid) => limiter(() => this.scanValidator(vid, input))),
    );

    const items = results.flat();
    const nextStartId = items.length >= input.limit ? input.startId + input.limit : null;

    const output: ListWithdrawalsOutput = { items, nextStartId };
    await this.cache.set(cacheKey, output);
    return output;
  }

  private async scanValidator(validatorId: bigint, input: ListWithdrawalsInput) {
    const items: ListWithdrawalsOutput['items'] = [];
    let misses = 0;
    let count = 0;

    for (let wid = input.startId; wid <= 255; wid++) {
      if (count >= input.limit || misses >= input.stopAfterMisses) break;

      const withdrawal = await this.blockchainClient.getWithdrawal(validatorId, input.address, wid);
      if (withdrawal) {
        items.push({
          validatorId: withdrawal.validatorId.toString(),
          withdrawalId: withdrawal.withdrawalId,
          amount: normalizeAmount(withdrawal.amount),
          accRewardPerToken: normalizeAmount(withdrawal.accRewardPerToken),
          withdrawEpoch: withdrawal.withdrawEpoch.toString(),
        });
        count++;
        misses = 0;
      } else {
        misses++;
      }
    }

    return items;
  }
}
