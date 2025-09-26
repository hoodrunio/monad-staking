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

export type ValidatorListItem = {
  validatorId: string;
  authAddress: string;
  commission: string;
  commissionRaw: string;
  stake: { execution: string; consensus: string; snapshot: string };
  unclaimedRewards: string;
  unclaimedRewardsRaw: string;
  flagsRaw: string;
  keys: { secpPubkey: string; blsPubkey: string };
  meta?: {
    name?: string;
    website?: string;
    logoUrl?: string;
  };
  isActive?: boolean;
  activeEpoch?: string;
};

export type ValidatorsQueryResult = {
  items: ValidatorListItem[];
  cursor: { next: string | null; prev: string | null };
  isDone: boolean;
};

export type ValidatorDetailResult = {
  validatorId: string;
  authAddress: string;
  commission: string;
  commissionRaw: string;
  stake: { execution: string; consensus: string; snapshot: string };
  unclaimedRewards: string;
  unclaimedRewardsRaw: string;
  flagsRaw: string;
  keys: { secpPubkey: string; blsPubkey: string };
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
};

export type DelegationListResult = {
  items: Array<{
    validatorId: string;
    stake: string;
    stakeRaw: string;
    unclaimedRewards: string;
    unclaimedRewardsRaw: string;
    deltaStake: string;
    nextDeltaStake: string;
    deltaEpoch: string;
    nextDeltaEpoch: string;
  }>;
  cursor: { next: string; done: boolean };
};

export type WithdrawalListResult = {
  items: Array<{
    validatorId: string;
    withdrawalId: number;
    amount: string;
    amountDisplay: string;
    withdrawEpoch: string;
    accRewardPerToken: string;
    accRewardPerTokenDisplay: string;
  }>;
  nextStartId: number | null;
};