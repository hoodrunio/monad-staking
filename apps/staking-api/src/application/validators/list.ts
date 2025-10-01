import type { ValidatorRepository } from '../../domain/validator';
import type { CacheService } from '../../infrastructure/cache/cache.service';
import type { Network } from '../../domain/types';
import { normalizeAmount, normalizeCommission } from '../../lib/format';
import { ensure0x } from '../../lib/key-format';

export interface ListValidatorsInput {
  network: Network;
  cursor?: string;
  limit: number;
  activeOnly?: boolean;
}

export interface ListValidatorsOutput {
  items: Array<{
    validatorId: string;
    authAddress: string;
    commission: { raw: string; rate: string; percent: string; basisPoints: string };
    stake: {
      execution: { raw: string; decimal: string };
      consensus: { raw: string; decimal: string };
      snapshot: { raw: string; decimal: string };
    };
    unclaimedRewards: { raw: string; decimal: string };
    flagsRaw: string;
    keys: { secpPubkey: string; blsPubkey: string };
    meta?: { name?: string; website?: string; logoUrl?: string };
    isActive?: boolean;
    activeEpoch?: string;
  }>;
  cursor: { next: string | null; prev: string | null };
  isDone: boolean;
}

export class ListValidatorsUseCase {
  constructor(
    private validatorRepo: ValidatorRepository,
    private cache: CacheService,
  ) {}

  async execute(input: ListValidatorsInput): Promise<ListValidatorsOutput> {
    const cacheKey = `list-db:${input.network}:${input.cursor ?? ''}:${input.limit}:${input.activeOnly ? 'active' : 'all'}`;
    const cached = await this.cache.get<ListValidatorsOutput>(cacheKey);
    if (cached) return cached;

    const { items, nextCursor } = await this.validatorRepo.list({
      network: input.network,
      cursor: input.cursor,
      limit: input.limit,
      activeOnly: input.activeOnly,
    });

    const output: ListValidatorsOutput = {
      items: items.map((v) => ({
        validatorId: v.id.toString(),
        authAddress: v.authAddress,
        commission: normalizeCommission(v.commission),
        stake: {
          execution: normalizeAmount(v.stake.execution),
          consensus: normalizeAmount(v.stake.consensus),
          snapshot: normalizeAmount(v.stake.snapshot),
        },
        unclaimedRewards: normalizeAmount(v.unclaimedRewards),
        flagsRaw: v.flags.toString(),
        keys: {
          secpPubkey: v.keys?.secpPubkey ? ensure0x(v.keys.secpPubkey) : '',
          blsPubkey: v.keys?.blsPubkey ?? '',
        },
        meta: v.metadata ? { name: v.metadata.name, website: v.metadata.website, logoUrl: v.metadata.logoUrl } : undefined,
        isActive: v.isActive,
        activeEpoch: v.activeEpoch?.toString(),
      })),
      cursor: { prev: null, next: nextCursor },
      isDone: nextCursor === null,
    };

    await this.cache.set(cacheKey, output);
    return output;
  }
}
