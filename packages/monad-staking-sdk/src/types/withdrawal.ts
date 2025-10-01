export interface WithdrawalRequestInfo {
  readonly withdrawalAmount: bigint;
  readonly accRewardPerToken: bigint;
  readonly withdrawEpoch: bigint;
}
