export interface EpochInfo {
  readonly epoch: bigint;
  readonly inEpochDelayPeriod: boolean;
}

export interface ActivationEpochInfo {
  readonly activationEpoch: bigint;
  readonly currentEpoch: bigint;
  readonly inEpochDelayPeriod: boolean;
  readonly reason: string;
}

export interface WithdrawEpochInfo {
  readonly withdrawEpoch: bigint;
  readonly currentEpoch: bigint;
  readonly inEpochDelayPeriod: boolean;
  readonly withdrawalDelay: number;
  readonly reason: string;
}
