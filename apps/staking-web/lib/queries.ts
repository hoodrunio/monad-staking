import { useQuery } from '@tanstack/react-query';
import { apiGet } from './api';
import type { MonadNetwork } from '@monad-staking/config';
import type {
  DelegationApiResponse,
  ValidatorDetailApiResponse,
  ValidatorListApiResponse,
  WithdrawalApiResponse,
  ValidatorsQueryResult,
  ValidatorDetailResult,
  DelegationListResult,
  WithdrawalListResult,
} from './api-types';
import { formatAmountField, formatCommissionField } from './format';

// Query keys factory
export const queryKeys = {
  epoch: (network: MonadNetwork) => ['epoch', network] as const,
  validators: (network: MonadNetwork, cursor: string, limit: number) => 
    ['validators', network, cursor, limit] as const,
  validator: (network: MonadNetwork, id: string) => 
    ['validator', network, id] as const,
  delegations: (network: MonadNetwork, address: string, cursor: string) => 
    ['delegations', network, address, cursor] as const,
  withdrawals: (network: MonadNetwork, address: string, validatorId?: string) => 
    ['withdrawals', network, address, validatorId] as const,
};

// Epoch query
export function useEpochQuery(network: MonadNetwork, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.epoch(network),
    queryFn: () => apiGet<{
      epoch: string;
      inEpochDelayPeriod: boolean;
      epochLength: number;
      epochDelayPeriod: number;
      withdrawalDelay: number;
    }>('/api/epoch', { network }),
    staleTime: 10_000, // 10 seconds
    refetchInterval: 30_000, // 30 seconds
    enabled: options?.enabled,
  });
}

// Validators list query
export function useValidatorsQuery(
  network: MonadNetwork, 
  cursor = '', 
  limit = 50,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.validators(network, cursor, limit),
    queryFn: async (): Promise<ValidatorsQueryResult> => {
      const response = await apiGet<ValidatorListApiResponse>('/api/validators', {
        network,
        cursor,
        limit,
      });

      return {
        items: response.items.map((item) => ({
          validatorId: item.validatorId,
          authAddress: item.authAddress,
          commission: formatCommissionField(item.commission),
          commissionRaw: item.commission.raw,
          stake: {
            execution: formatAmountField(item.stake.execution),
            consensus: formatAmountField(item.stake.consensus),
            snapshot: formatAmountField(item.stake.snapshot),
          },
          unclaimedRewards: formatAmountField(item.unclaimedRewards),
          unclaimedRewardsRaw: item.unclaimedRewards.raw,
          flagsRaw: item.flagsRaw,
          keys: item.keys,
          meta: item.meta,
          isActive: item.isActive,
          activeEpoch: item.activeEpoch,
        })),
        cursor: response.cursor,
        isDone: response.isDone,
      };
    },
    staleTime: 30_000, // 30 seconds
    enabled: options?.enabled,
  });
}

// Single validator query
export function useValidatorQuery(
  network: MonadNetwork, 
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.validator(network, id),
    queryFn: async (): Promise<ValidatorDetailResult> => {
      const data = await apiGet<ValidatorDetailApiResponse>(`/api/validators/${id}`, { network });

      return {
        validatorId: data.validatorId,
        authAddress: data.authAddress,
        commission: formatCommissionField(data.commission),
        commissionRaw: data.commission.raw,
        stake: {
          execution: formatAmountField(data.stake.execution),
          consensus: formatAmountField(data.stake.consensus),
          snapshot: formatAmountField(data.stake.snapshot),
        },
        unclaimedRewards: formatAmountField(data.unclaimedRewards),
        unclaimedRewardsRaw: data.unclaimedRewards.raw,
        flagsRaw: data.flagsRaw,
        keys: data.keys,
        meta: data.meta,
        isActive: data.isActive,
        activeEpoch: data.activeEpoch,
      };
    },
    staleTime: 60_000, // 1 minute
    enabled: (options?.enabled !== false) && !!id && id !== '0',
  });
}

// Delegations query
export function useDelegationsQuery(
  network: MonadNetwork, 
  address: string, 
  cursor = '0',
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.delegations(network, address, cursor),
    queryFn: async (): Promise<DelegationListResult> => {
      const data = await apiGet<DelegationApiResponse>('/api/delegations', {
        network,
        address,
        cursor,
      });

      return {
        items: data.items.map((item) => ({
          validatorId: item.validatorId,
          stake: formatAmountField(item.stake),
          stakeRaw: item.stake.raw,
          unclaimedRewards: formatAmountField(item.unclaimedRewards),
          unclaimedRewardsRaw: item.unclaimedRewards.raw,
          deltaStake: item.deltaStake.raw,
          nextDeltaStake: item.nextDeltaStake.raw,
          deltaEpoch: item.deltaEpoch,
          nextDeltaEpoch: item.nextDeltaEpoch,
        })),
        cursor: data.cursor,
      };
    },
    staleTime: 20_000, // 20 seconds
    enabled: (options?.enabled !== false) && !!address,
  });
}

// Withdrawals query
export function useWithdrawalsQuery(
  network: MonadNetwork, 
  address: string, 
  validatorId?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.withdrawals(network, address, validatorId),
    queryFn: async (): Promise<WithdrawalListResult> => {
      const data = await apiGet<WithdrawalApiResponse>('/api/withdrawals', {
        network,
        address,
        ...(validatorId ? { validatorId } : {}),
        startId: 1,
        limit: 64,
      });

      return {
        items: data.items.map((item) => ({
          validatorId: item.validatorId,
          withdrawalId: item.withdrawalId,
          amount: item.amount.raw,
          amountDisplay: formatAmountField(item.amount),
          withdrawEpoch: item.withdrawEpoch,
          accRewardPerToken: item.accRewardPerToken.raw,
          accRewardPerTokenDisplay: formatAmountField(item.accRewardPerToken, { suffix: '' }),
        })),
        nextStartId: data.nextStartId,
      };
    },
    staleTime: 20_000, // 20 seconds
    enabled: (options?.enabled !== false) && !!address,
  });
}
