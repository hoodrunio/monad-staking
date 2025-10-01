import type { Address } from 'viem';

export interface ValidatorInfo {
  readonly authAddress: Address;
  readonly flags: bigint;
  readonly stake: bigint;
  readonly accRewardPerToken: bigint;
  readonly commission: bigint;
  readonly unclaimedRewards: bigint;
  readonly consensusStake: bigint;
  readonly consensusCommission: bigint;
  readonly snapshotStake: bigint;
  readonly snapshotCommission: bigint;
  readonly secpPubkey: `0x${string}`;
  readonly blsPubkey: `0x${string}`;
}

export interface PaginatedValidatorSet {
  readonly isDone: boolean;
  readonly nextIndex: number;
  readonly validatorIds: readonly bigint[];
}
