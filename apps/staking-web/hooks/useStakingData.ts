import { useMemo } from 'react';
import type { MonadNetwork } from '@monad-staking/config';
import { useAccount } from 'wagmi';
import {
  useBalanceQuery,
  useDelegationsQuery,
  useEpochQuery,
  useValidatorsQuery,
  useWithdrawalsQuery,
} from '@/lib/queries';
import type { DelegationSummary, ValidatorSummary, WithdrawalSummary } from '@/lib/api/models';

export interface StakingDataResult {
  readonly epoch: ReturnType<typeof useEpochQuery>['data'];
  readonly validators: readonly ValidatorSummary[];
  readonly delegations: readonly DelegationSummary[];
  readonly withdrawals: readonly WithdrawalSummary[];
  readonly balance: ReturnType<typeof useBalanceQuery>['data'];
  readonly isLoading: {
    epoch: boolean;
    validators: boolean;
    delegations: boolean;
    withdrawals: boolean;
    balance: boolean;
  };
  readonly isError: {
    validators: boolean;
    delegations: boolean;
    withdrawals: boolean;
    balance: boolean;
  };
  readonly validatorMap: Map<string, ValidatorSummary>;
  readonly refetchAll: () => void;
}

export function useStakingData(network: MonadNetwork | undefined, enabled: boolean): StakingDataResult {
  const { address } = useAccount();
  const account = address ?? '';

  const fallbackNetwork = (network ?? 'monad-mainnet') as MonadNetwork;

  const epochQuery = useEpochQuery(fallbackNetwork, { enabled: enabled && !!network });
  const validatorQuery = useValidatorsQuery(fallbackNetwork, '', 100, { enabled: enabled && !!network });
  const delegationQuery = useDelegationsQuery(fallbackNetwork, account, '0', {
    enabled: enabled && !!network && !!account,
  });
  const withdrawalQuery = useWithdrawalsQuery(fallbackNetwork, account, undefined, {
    enabled: enabled && !!network && !!account,
  });
  const balanceQuery = useBalanceQuery(fallbackNetwork, account, {
    enabled: enabled && !!network && !!account,
  });

  const validatorMap = useMemo(() => {
    if (!validatorQuery.data) return new Map<string, ValidatorSummary>();
    return new Map(validatorQuery.data.items.map((item) => [item.id, item]));
  }, [validatorQuery.data]);

  return {
    epoch: epochQuery.data,
    validators: validatorQuery.data?.items ?? [],
    delegations: delegationQuery.data?.items ?? [],
    withdrawals: withdrawalQuery.data?.items ?? [],
    balance: balanceQuery.data,
    isLoading: {
      epoch: epochQuery.isLoading,
      validators: validatorQuery.isLoading,
      delegations: delegationQuery.isLoading,
      withdrawals: withdrawalQuery.isLoading,
      balance: balanceQuery.isLoading,
    },
    isError: {
      validators: !!validatorQuery.error,
      delegations: !!delegationQuery.error,
      withdrawals: !!withdrawalQuery.error,
      balance: !!balanceQuery.error,
    },
    validatorMap,
    refetchAll: () => {
      void epochQuery.refetch();
      void validatorQuery.refetch();
      void delegationQuery.refetch();
      void withdrawalQuery.refetch();
      void balanceQuery.refetch();
    },
  };
}
