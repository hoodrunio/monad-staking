import type {
  DelegationApiItem,
  DelegationApiResponse,
  ValidatorDetailApiResponse,
  ValidatorListApiItem,
  ValidatorListApiResponse,
  WithdrawalApiItem,
  WithdrawalApiResponse,
} from './types';
import type {
  AmountDisplay,
  CommissionDisplay,
  DelegationPage,
  DelegationSummary,
  PaginatedValidators,
  ValidatorDetail,
  ValidatorSummary,
  WithdrawalPage,
  WithdrawalSummary,
} from './models';
import { formatAmountField, formatCommissionField } from '../format';

function toAmountDisplay(field: { raw: string; decimal: string }, formatted: string, suffix = ' MON'): AmountDisplay {
  const display = formatted || (field.decimal ? `${field.decimal}${suffix}` : `0${suffix}`);
  return {
    raw: field.raw,
    decimal: field.decimal,
    formatted: display,
  };
}

function toCommissionDisplay(field: { raw: string; percent: string }, formatted: string): CommissionDisplay {
  const display = formatted || `${field.percent}%`;
  return {
    raw: field.raw,
    percent: field.percent,
    formatted: display,
  };
}

function mapValidator(item: ValidatorListApiItem): ValidatorSummary {
  const commissionFormatted = formatCommissionField(item.commission);
  const stakeFormatted = formatAmountField(item.stake.consensus);
  const rewardsFormatted = formatAmountField(item.unclaimedRewards);

  return {
    id: item.validatorId,
    validatorId: item.validatorId,
    authAddress: item.authAddress,
    commission: toCommissionDisplay(item.commission, commissionFormatted),
    stake: toAmountDisplay(item.stake.consensus, stakeFormatted),
    unclaimedRewards: toAmountDisplay(item.unclaimedRewards, rewardsFormatted),
    flagsRaw: item.flagsRaw,
    keys: item.keys,
    meta: item.meta,
    isActive: item.isActive,
    activeEpoch: item.activeEpoch,
  };
}

export function mapValidatorList(response: ValidatorListApiResponse): PaginatedValidators {
  return {
    items: response.items.map(mapValidator),
    cursor: response.cursor,
    isDone: response.isDone,
  };
}

export function mapValidatorDetail(response: ValidatorDetailApiResponse): ValidatorDetail {
  const summary = mapValidator(response);
  return {
    ...summary,
    meta: response.meta,
  };
}

function mapDelegation(item: DelegationApiItem): DelegationSummary {
  return {
    validatorId: item.validatorId,
    stake: toAmountDisplay(item.stake, formatAmountField(item.stake)),
    unclaimedRewards: toAmountDisplay(item.unclaimedRewards, formatAmountField(item.unclaimedRewards)),
    deltaStakeRaw: item.deltaStake.raw,
    nextDeltaStakeRaw: item.nextDeltaStake.raw,
    deltaEpoch: item.deltaEpoch,
    nextDeltaEpoch: item.nextDeltaEpoch,
  };
}

export function mapDelegations(response: DelegationApiResponse): DelegationPage {
  return {
    items: response.items.map(mapDelegation),
    cursor: response.cursor,
  };
}

function mapWithdrawal(item: WithdrawalApiItem): WithdrawalSummary {
  return {
    validatorId: item.validatorId,
    withdrawalId: item.withdrawalId,
    amount: toAmountDisplay(item.amount, formatAmountField(item.amount)),
    accRewardPerToken: toAmountDisplay(item.accRewardPerToken, formatAmountField(item.accRewardPerToken, { suffix: '' }), ''),
    withdrawEpoch: item.withdrawEpoch,
  };
}

export function mapWithdrawals(response: WithdrawalApiResponse): WithdrawalPage {
  return {
    items: response.items.map(mapWithdrawal),
    nextStartId: response.nextStartId,
  };
}

export { mapValidator as mapValidatorSummary };
