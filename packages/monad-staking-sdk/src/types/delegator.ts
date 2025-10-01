import type { Address } from 'viem';

export interface DelegatorInfo {
  readonly stake: bigint;
  readonly accRewardPerToken: bigint;
  readonly unclaimedRewards: bigint;
  readonly deltaStake: bigint;
  readonly nextDeltaStake: bigint;
  readonly deltaEpoch: bigint;
  readonly nextDeltaEpoch: bigint;
}

export interface PaginatedDelegations {
  readonly isDone: boolean;
  readonly nextValId: bigint;
  readonly validatorIds: readonly bigint[];
}

export interface PaginatedDelegators {
  readonly isDone: boolean;
  readonly nextDelegator: Address;
  readonly delegators: readonly Address[];
}
