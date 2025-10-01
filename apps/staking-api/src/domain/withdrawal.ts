export interface Withdrawal {
  validatorId: bigint;
  delegatorAddress: string;
  withdrawalId: number;
  amount: bigint;
  accRewardPerToken: bigint;
  withdrawEpoch: bigint;
}
