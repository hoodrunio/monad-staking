import type { ValidatorMetaSummary } from './types';

export interface AmountDisplay {
  readonly raw: string;
  readonly decimal: string;
  readonly formatted: string;
}

export interface CommissionDisplay {
  readonly raw: string;
  readonly percent: string;
  readonly formatted: string;
}

export interface ValidatorSummary {
  readonly id: string;
  readonly validatorId: string;
  readonly authAddress: string;
  readonly stake: AmountDisplay;
  readonly commission: CommissionDisplay;
  readonly unclaimedRewards: AmountDisplay;
  readonly flagsRaw: string;
  readonly keys: { readonly secpPubkey: string; readonly blsPubkey: string };
  readonly meta?: Pick<ValidatorMetaSummary, 'name' | 'website' | 'logoUrl'>;
  readonly isActive?: boolean;
  readonly activeEpoch?: string;
}

export interface ValidatorDetail extends Omit<ValidatorSummary, 'meta'> {
  readonly meta?: ValidatorMetaSummary;
}

export interface DelegationSummary {
  readonly validatorId: string;
  readonly stake: AmountDisplay;
  readonly unclaimedRewards: AmountDisplay;
  readonly deltaStakeRaw: string;
  readonly nextDeltaStakeRaw: string;
  readonly deltaEpoch: string;
  readonly nextDeltaEpoch: string;
}

export interface WithdrawalSummary {
  readonly validatorId: string;
  readonly withdrawalId: number;
  readonly amount: AmountDisplay;
  readonly accRewardPerToken: AmountDisplay;
  readonly withdrawEpoch: string;
}

export interface PaginatedValidators {
  readonly items: ValidatorSummary[];
  readonly cursor: { readonly next: string | null; readonly prev: string | null };
  readonly isDone: boolean;
}

export interface DelegationPage {
  readonly items: DelegationSummary[];
  readonly cursor: { readonly next: string; readonly done: boolean };
}

export interface WithdrawalPage {
  readonly items: WithdrawalSummary[];
  readonly nextStartId: number | null;
}
