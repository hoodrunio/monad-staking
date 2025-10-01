import type { ValidatorRepository } from '../../domain/validator';
import type { BlockchainClient } from '../../infrastructure/blockchain/sdk.client';
import type { CacheService } from '../../infrastructure/cache/cache.service';
import type { Network } from '../../domain/types';
import { normalizeAmount, normalizeCommission } from '../../lib/format';
import { ensure0x, normalizeSecpKey, normalizeHexNo0x } from '../../lib/key-format';
import { logger } from '../../infrastructure';

export interface GetValidatorDetailInput {
  network: Network;
  id?: bigint;
  secp?: string;
  authAddress?: string;
}

export interface GetValidatorDetailOutput {
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
  keys: { secpPubkey: `${string}`; blsPubkey: `${string}` };
  meta?: {
    name?: string;
    website?: string;
    description?: string;
    logoUrl?: string;
    contacts?: Record<string, string>;
    githubPath?: string;
    githubSha?: string;
  };
  isActive?: boolean;
  activeEpoch?: string;
}

export class GetValidatorDetailUseCase {
  constructor(
    private validatorRepo: ValidatorRepository,
    private blockchainClient: BlockchainClient,
    private cache: CacheService,
  ) {}

  async execute(input: GetValidatorDetailInput): Promise<GetValidatorDetailOutput> {
    const cacheKey = `detail:${input.network}:${input.id !== undefined ? input.id.toString() : `secp:${input.secp}`}`;
    const cached = await this.cache.get<GetValidatorDetailOutput>(cacheKey);
    if (cached) return cached;

    let validator = await this.findValidator(input);

    if (!validator && input.id !== undefined) {
      validator = await this.fetchFromBlockchain(input.network, input.id);
    }

    if (!validator) {
      throw new Error('Validator not found');
    }

    const output: GetValidatorDetailOutput = {
      validatorId: validator.id.toString(),
      authAddress: validator.authAddress,
      commission: normalizeCommission(validator.commission),
      stake: {
        execution: normalizeAmount(validator.stake.execution),
        consensus: normalizeAmount(validator.stake.consensus),
        snapshot: normalizeAmount(validator.stake.snapshot),
      },
      unclaimedRewards: normalizeAmount(validator.unclaimedRewards),
      flagsRaw: validator.flags.toString(),
      keys: {
        secpPubkey: validator.keys?.secpPubkey ? ensure0x(validator.keys.secpPubkey) : ('' as `${string}`),
        blsPubkey: (validator.keys?.blsPubkey ?? '') as `${string}`,
      },
      meta: validator.metadata,
      isActive: validator.isActive,
      activeEpoch: validator.activeEpoch?.toString(),
    };

    await this.cache.set(cacheKey, output);
    return output;
  }

  private async findValidator(input: GetValidatorDetailInput) {
    if (input.id !== undefined) {
      return await this.validatorRepo.findById(input.network, input.id);
    }
    if (input.secp) {
      return await this.validatorRepo.findBySecp(input.network, input.secp);
    }
    if (input.authAddress) {
      return await this.validatorRepo.findByAuth(input.network, input.authAddress);
    }
    return null;
  }

  private async fetchFromBlockchain(network: Network, id: bigint) {
    try {
      const v = await this.blockchainClient.getValidator(id);
      const normalizedSecp = normalizeSecpKey(v.secpPubkey) ?? normalizeHexNo0x(v.secpPubkey);

      const validator = {
        id,
        network,
        authAddress: v.authAddress,
        commission: v.commission,
        stake: {
          execution: v.stake,
          consensus: v.consensusStake,
          snapshot: v.snapshotStake,
        },
        unclaimedRewards: v.unclaimedRewards,
        flags: v.flags,
        keys: {
          secpPubkey: normalizedSecp ? ensure0x(normalizedSecp) : ensure0x(v.secpPubkey),
          blsPubkey: v.blsPubkey,
        },
        updatedAt: new Date(),
      };

      await this.validatorRepo.save(validator);
      return validator;
    } catch (err) {
      logger.error(`Failed to fetch validator ${id.toString()} from blockchain`, err);
      return null;
    }
  }
}
