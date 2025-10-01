export interface Delegation {
  validatorId: bigint;
  delegatorAddress: string;
  stake: bigint;
  unclaimedRewards: bigint;
  deltaStake: bigint;
  nextDeltaStake: bigint;
  deltaEpoch: bigint;
  nextDeltaEpoch: bigint;
}

export interface DelegationPage {
  items: Delegation[];
  nextCursor: bigint;
  isDone: boolean;
}
