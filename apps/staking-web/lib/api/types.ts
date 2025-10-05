export interface AmountField {
  readonly raw: string;
  readonly decimal: string;
}

export interface CommissionField {
  readonly raw: string;
  readonly rate: string;
  readonly percent: string;
  readonly basisPoints: string;
}

export interface ValidatorMetaSummary {
  readonly name?: string;
  readonly website?: string;
  readonly description?: string;
  readonly logoUrl?: string;
  readonly contacts?: Record<string, string>;
  readonly githubPath?: string;
  readonly githubSha?: string;
}

export interface ValidatorListApiItem {
  readonly validatorId: string;
  readonly authAddress: string;
  readonly commission: CommissionField;
  readonly stake: {
    readonly execution: AmountField;
    readonly consensus: AmountField;
    readonly snapshot: AmountField;
  };
  readonly unclaimedRewards: AmountField;
  readonly flagsRaw: string;
  readonly keys: { readonly secpPubkey: string; readonly blsPubkey: string };
  readonly meta?: Pick<ValidatorMetaSummary, 'name' | 'website' | 'logoUrl'>;
  readonly isActive?: boolean;
  readonly activeEpoch?: string;
}

export interface ValidatorListApiResponse {
  readonly items: ValidatorListApiItem[];
  readonly cursor: { next: string | null; prev: string | null };
  readonly isDone: boolean;
}

export interface ValidatorDetailApiResponse extends Omit<ValidatorListApiItem, 'meta'> {
  readonly meta?: ValidatorMetaSummary;
}

export interface DelegationApiItem {
  readonly validatorId: string;
  readonly stake: AmountField;
  readonly unclaimedRewards: AmountField;
  readonly deltaStake: AmountField;
  readonly nextDeltaStake: AmountField;
  readonly deltaEpoch: string;
  readonly nextDeltaEpoch: string;
}

export interface DelegationApiResponse {
  readonly items: DelegationApiItem[];
  readonly cursor: { next: string; done: boolean };
}

export interface WithdrawalApiItem {
  readonly validatorId: string;
  readonly withdrawalId: number;
  readonly amount: AmountField;
  readonly accRewardPerToken: AmountField;
  readonly withdrawEpoch: string;
}

export interface WithdrawalApiResponse {
  readonly items: WithdrawalApiItem[];
  readonly nextStartId: number | null;
}

export interface BalanceApiResponse {
  readonly available: AmountField;
  readonly staked: AmountField;
}

export interface EpochProgressSampleApiResponse {
  readonly epoch: string;
  readonly totalDurationMs: number;
  readonly activeDurationMs: number | null;
  readonly delayDurationMs: number | null;
  readonly completedAt: string;
}

export type EpochProgressSource = 'derived' | 'stale' | 'unavailable';

export interface EpochProgressApiResponse {
  readonly phase: 'active' | 'delay';
  readonly percent: number | null;
  readonly phasePercent: number | null;
  readonly estimatedEpochDurationMs: number | null;
  readonly estimatedPhaseDurationMs: number | null;
  readonly elapsedMs: number | null;
  readonly phaseElapsedMs: number | null;
  readonly estimatedTimeToNextEpochMs: number | null;
  readonly estimatedPhaseTimeRemainingMs: number | null;
  readonly epochStartedAt: string | null;
  readonly delayStartedAt: string | null;
  readonly lastEpochDurationMs: number | null;
  readonly lastEpochActiveDurationMs: number | null;
  readonly lastEpochDelayDurationMs: number | null;
  readonly samples: ReadonlyArray<EpochProgressSampleApiResponse>;
  readonly observedAt: string | null;
  readonly calculatedAt: string;
  readonly source: EpochProgressSource;
}

export interface EpochApiResponse {
  readonly epoch: string;
  readonly inEpochDelayPeriod: boolean;
  readonly epochLength: number;
  readonly epochDelayPeriod: number;
  readonly withdrawalDelay: number;
  readonly progress: EpochProgressApiResponse;
}
