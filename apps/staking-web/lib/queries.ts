import { useQuery } from '@tanstack/react-query';
import { apiGet } from './api';
import type { MonadNetwork } from '@monad-staking/config';

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
    queryFn: () => apiGet<{
      items: Array<{
        validatorId: string;
        authAddress: string;
        commission: string;
        stake: { execution: string; consensus: string; snapshot: string };
        unclaimedRewards: string;
        flagsRaw: string;
        meta?: {
          name?: string;
          website?: string;
          logoUrl?: string;
        };
      }>;
      cursor: { next: string | null; prev: string | null };
      isDone: boolean;
    }>('/api/validators', { network, cursor, limit }),
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
    queryFn: () => apiGet<{
      validatorId: string;
      authAddress: string;
      commissionRaw: string;
      commission: string;
      stake: { execution: string; consensus: string; snapshot: string };
      unclaimedRewards: string;
      flagsRaw: string;
      keys: { secpPubkey: string; blsPubkey: string };
      meta?: {
        name?: string;
        website?: string;
        description?: string;
        logoUrl?: string;
      };
    }>('/api/validators/' + id, { network }),
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
    queryFn: () => apiGet<{
      items: Array<{
        validatorId: string;
        stake: string;
        unclaimedRewards: string;
        deltaStake: string;
        nextDeltaStake: string;
        deltaEpoch: string;
        nextDeltaEpoch: string;
      }>;
      cursor: { next: string; done: boolean };
    }>('/api/delegations', { network, address, cursor }),
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
    queryFn: () => apiGet<{
      items: Array<{
        validatorId: string;
        withdrawalId: number;
        amount: string;
        withdrawEpoch: string;
      }>;
      nextStartId: number | null;
    }>('/api/withdrawals', { 
      network, 
      address, 
      ...(validatorId ? { validatorId } : {}),
      startId: 1,
      limit: 64,
    }),
    staleTime: 20_000, // 20 seconds
    enabled: (options?.enabled !== false) && !!address,
  });
}
