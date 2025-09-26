import { useQuery } from '@tanstack/react-query';
import type { MonadNetwork } from '@monad-staking/config';
import { apiGet } from './api';
import type {
  DelegationApiResponse,
  ValidatorDetailApiResponse,
  ValidatorListApiResponse,
  WithdrawalApiResponse,
} from './api/types';
import type {
  DelegationPage,
  PaginatedValidators,
  ValidatorDetail,
  WithdrawalPage,
} from './api/models';
import {
  mapDelegations,
  mapValidatorDetail,
  mapValidatorList,
  mapWithdrawals,
} from './api/transformers';

export type ValidatorsQueryResult = PaginatedValidators;
export type ValidatorDetailResult = ValidatorDetail;
export type DelegationListResult = DelegationPage;
export type WithdrawalListResult = WithdrawalPage;

export const queryKeys = {
  epoch: (network: MonadNetwork) => ['epoch', network] as const,
  validators: (network: MonadNetwork, cursor: string, limit: number) =>
    ['validators', network, cursor, limit] as const,
  validator: (network: MonadNetwork, id: string) => ['validator', network, id] as const,
  delegations: (network: MonadNetwork, address: string, cursor: string) =>
    ['delegations', network, address, cursor] as const,
  withdrawals: (network: MonadNetwork, address: string, validatorId?: string) =>
    ['withdrawals', network, address, validatorId] as const,
};

export function useEpochQuery(network: MonadNetwork, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.epoch(network),
    queryFn: () =>
      apiGet<{
        epoch: string;
        inEpochDelayPeriod: boolean;
        epochLength: number;
        epochDelayPeriod: number;
        withdrawalDelay: number;
      }>('/api/epoch', { network }),
    staleTime: 10_000,
    refetchInterval: 30_000,
    enabled: options?.enabled,
  });
}

export function useValidatorsQuery(
  network: MonadNetwork,
  cursor = '',
  limit = 50,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.validators(network, cursor, limit),
    queryFn: async (): Promise<ValidatorsQueryResult> => {
      const response = await apiGet<ValidatorListApiResponse>('/api/validators', {
        network,
        cursor,
        limit,
      });
      return mapValidatorList(response);
    },
    staleTime: 30_000,
    enabled: options?.enabled,
  });
}

export function useValidatorQuery(
  network: MonadNetwork,
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.validator(network, id),
    queryFn: async (): Promise<ValidatorDetailResult> => {
      const response = await apiGet<ValidatorDetailApiResponse>(`/api/validators/${id}`, { network });
      return mapValidatorDetail(response);
    },
    staleTime: 60_000,
    enabled: options?.enabled !== false && !!id && id !== '0',
  });
}

export function useDelegationsQuery(
  network: MonadNetwork,
  address: string,
  cursor = '0',
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.delegations(network, address, cursor),
    queryFn: async (): Promise<DelegationListResult> => {
      const response = await apiGet<DelegationApiResponse>('/api/delegations', {
        network,
        address,
        cursor,
      });
      return mapDelegations(response);
    },
    staleTime: 20_000,
    enabled: options?.enabled !== false && !!address,
  });
}

export function useWithdrawalsQuery(
  network: MonadNetwork,
  address: string,
  validatorId?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.withdrawals(network, address, validatorId),
    queryFn: async (): Promise<WithdrawalListResult> => {
      const response = await apiGet<WithdrawalApiResponse>('/api/withdrawals', {
        network,
        address,
        ...(validatorId ? { validatorId } : {}),
        startId: 1,
        limit: 64,
      });
      return mapWithdrawals(response);
    },
    staleTime: 20_000,
    enabled: options?.enabled !== false && !!address,
  });
}

