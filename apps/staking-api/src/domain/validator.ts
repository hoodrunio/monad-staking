import type { Network, Keys, ValidatorMetadata } from './types';

export interface Validator {
  id: bigint;
  network: Network;
  authAddress: string;
  commission: bigint;
  stake: {
    execution: bigint;
    consensus: bigint;
    snapshot: bigint;
  };
  unclaimedRewards: bigint;
  flags: bigint;
  keys?: Keys;
  isActive?: boolean;
  activeEpoch?: bigint;
  metadata?: ValidatorMetadata;
  updatedAt: Date;
}

export interface ValidatorRepository {
  findById(network: Network, id: bigint): Promise<Validator | null>;
  findBySecp(network: Network, secp: string): Promise<Validator | null>;
  findByAuth(network: Network, authAddress: string): Promise<Validator | null>;
  list(params: {
    network: Network;
    cursor?: string;
    limit: number;
    activeOnly?: boolean;
  }): Promise<{ items: Validator[]; nextCursor: string | null }>;
  save(validator: Validator): Promise<void>;
  saveMany(validators: Validator[]): Promise<void>;
  updateConsensusStatus(network: Network, activeIds: bigint[]): Promise<void>;
  updateMetadata(network: Network, secp: string, metadata: ValidatorMetadata): Promise<number>;
  normalizeSecpKeys(network: Network): Promise<number>;
}
