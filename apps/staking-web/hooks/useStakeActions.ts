import { useCallback, useEffect, useState } from 'react';
import type { MonadStakingSdk } from '@monad-staking/sdk';
import type { Transport } from 'viem';
import {
  canPerformTransaction,
  handleClaimAllRewards,
  handleClaimRewards,
  handleCompound,
  handleDelegate,
  handleUndelegate,
  handleWithdraw,
  parseAmountToWei,
  parseValidatorId,
  type StakeFormState,
} from '@/lib/stake-utils';

type NullableAccount = `0x${string}` | undefined;

type ActionResult = Promise<void>;

type SettleCallback = () => void;

type StakeActionsOptions = {
  sdk: MonadStakingSdk<Transport> | null;
  account: NullableAccount;
  onSettled?: SettleCallback;
};

const INITIAL_STATE: StakeFormState = {
  busy: false,
  busyAction: null,
  txError: null,
  txHash: null,
  txStage: 'idle',
  txCount: 0,
  txContext: null,
};

export function useStakeActions({ sdk, account, onSettled }: StakeActionsOptions) {
  const [state, setState] = useState<StakeFormState>(INITIAL_STATE);

  const ensureEnvironment = useCallback(() => {
    if (!sdk || !account) {
      throw new Error('Wallet must be connected to perform staking actions');
    }
  }, [sdk, account]);

  const delegate = useCallback(
    async (validatorId: string, amountMon: string): ActionResult => {
      ensureEnvironment();
      const id = parseValidatorId(validatorId);
      const amount = parseAmountToWei(amountMon);
      if (!canPerformTransaction(sdk!, account, id, amount, state.busy)) return;
      await handleDelegate(sdk!, id, amount, account!, setState, 'stake');
    },
    [account, ensureEnvironment, sdk, state.busy],
  );

  const undelegate = useCallback(
    async (validatorId: string, amountMon: string, withdrawalId: number): ActionResult => {
      ensureEnvironment();
      const id = parseValidatorId(validatorId);
      const amount = parseAmountToWei(amountMon);
      if (!canPerformTransaction(sdk!, account, id, amount, state.busy)) return;
      await handleUndelegate(sdk!, id, amount, withdrawalId, account!, setState, 'unstake');
    },
    [account, ensureEnvironment, sdk, state.busy],
  );

  const withdraw = useCallback(
    async (validatorId: string, withdrawalId: number): ActionResult => {
      ensureEnvironment();
      const id = parseValidatorId(validatorId);
      await handleWithdraw(sdk!, id, withdrawalId, account!, setState, 'withdraw');
    },
    [account, ensureEnvironment, sdk],
  );

  const compound = useCallback(
    async (validatorId: string): ActionResult => {
      ensureEnvironment();
      const id = parseValidatorId(validatorId);
      await handleCompound(sdk!, id, account!, setState, 'compound');
    },
    [account, ensureEnvironment, sdk],
  );

  const claimRewards = useCallback(
    async (validatorId: string): ActionResult => {
      ensureEnvironment();
      const id = parseValidatorId(validatorId);
      await handleClaimRewards(sdk!, id, account!, setState, 'claim');
    },
    [account, ensureEnvironment, sdk],
  );

  const claimAllRewards = useCallback(async (): ActionResult => {
    ensureEnvironment();
    await handleClaimAllRewards(sdk!, account!, setState, 'claim-all');
  }, [account, ensureEnvironment, sdk]);

  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => {
    if (state.txStage === 'confirmed') {
      onSettled?.();
    }
  }, [onSettled, state.txStage]);

  return {
    state,
    setState,
    delegate,
    undelegate,
    withdraw,
    compound,
    claimRewards,
    claimAllRewards,
    resetState,
  } as const;
}
