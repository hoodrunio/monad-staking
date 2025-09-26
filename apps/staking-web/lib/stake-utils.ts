import toast from 'react-hot-toast';
import type { MonadStakingSdk } from '@monad-staking/sdk';
import type { Transport } from 'viem';

export interface StakeFormData {
  validatorId: string;
  amountMon: string;
  withdrawId: number;
}

export interface StakeFormState {
  txError: string | null;
  txHash: string | null;
  busy: boolean;
  busyAction: string | null;
  txStage: TransactionStage;
}

export type TransactionStage = 'idle' | 'pending' | 'submitted' | 'confirmed' | 'error';

type StakeStateSetter = (updater: (prev: StakeFormState) => StakeFormState) => void;

function mergeState(setState: StakeStateSetter, updates: Partial<StakeFormState>) {
  setState((prev) => ({ ...prev, ...updates }));
}

export function parseValidatorId(validatorId: string): bigint {
  try {
    return BigInt(validatorId || '0');
  } catch {
    return 0n;
  }
}

export function parseAmountToWei(amountMon: string): bigint {
  if (!amountMon) return 0n;
  try {
    const [int, frac = ''] = amountMon.split('.');
    const fracPadded = (frac + '0'.repeat(18)).slice(0, 18);
    return BigInt(int || '0') * (10n ** 18n) + BigInt(fracPadded || '0');
  } catch {
    return 0n;
  }
}

export function canPerformTransaction(
  sdk: MonadStakingSdk<Transport> | null,
  account: `0x${string}` | undefined,
  validatorBig: bigint,
  amountWei: bigint,
  busy: boolean
): boolean {
  return Boolean(sdk && account && validatorBig > 0n && amountWei > 0n && !busy);
}

export async function handleDelegate(
  sdk: MonadStakingSdk<Transport>,
  validatorId: bigint,
  amount: bigint,
  account: `0x${string}`,
  setState: StakeStateSetter,
  busyAction?: string,
): Promise<void> {
  mergeState(setState, {
    busy: true,
    txError: null,
    txHash: null,
    busyAction: busyAction ?? 'delegate',
    txStage: 'pending',
  });
  
  try {
    const hash = await sdk.delegate({
      validatorId,
      amount,
      account,
    });
    mergeState(setState, { txHash: hash, busy: false, busyAction: null, txStage: 'submitted' });
    toast.success('Delegation transaction submitted!');
    void waitForConfirmation(sdk, hash, setState);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    mergeState(setState, { txError: message, busy: false, busyAction: null, txStage: 'error' });
    toast.error(`Delegation failed: ${message}`);
  }
}

export async function handleUndelegate(
  sdk: MonadStakingSdk<Transport>,
  validatorId: bigint,
  amount: bigint,
  withdrawalId: number,
  account: `0x${string}`,
  setState: StakeStateSetter,
  busyAction?: string,
): Promise<void> {
  mergeState(setState, {
    busy: true,
    txError: null,
    txHash: null,
    busyAction: busyAction ?? 'undelegate',
    txStage: 'pending',
  });
  
  try {
    const hash = await sdk.undelegate({
      validatorId,
      amount,
      withdrawalId,
      account,
    });
    mergeState(setState, { txHash: hash, busy: false, busyAction: null, txStage: 'submitted' });
    toast.success('Undelegation transaction submitted!');
    void waitForConfirmation(sdk, hash, setState);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    mergeState(setState, { txError: message, busy: false, busyAction: null, txStage: 'error' });
    toast.error(`Undelegation failed: ${message}`);
  }
}

export async function handleWithdraw(
  sdk: MonadStakingSdk<Transport>,
  validatorId: bigint,
  withdrawalId: number,
  account: `0x${string}`,
  setState: StakeStateSetter,
  busyAction?: string,
): Promise<void> {
  mergeState(setState, {
    busy: true,
    txError: null,
    txHash: null,
    busyAction: busyAction ?? 'withdraw',
    txStage: 'pending',
  });
  
  try {
    const hash = await sdk.withdraw({
      validatorId,
      withdrawalId,
      account,
    });
    mergeState(setState, { txHash: hash, busy: false, busyAction: null, txStage: 'submitted' });
    toast.success('Withdrawal transaction submitted!');
    void waitForConfirmation(sdk, hash, setState);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    mergeState(setState, { txError: message, busy: false, busyAction: null, txStage: 'error' });
    toast.error(`Withdrawal failed: ${message}`);
  }
}

export async function handleCompound(
  sdk: MonadStakingSdk<Transport>,
  validatorId: bigint,
  account: `0x${string}`,
  setState: StakeStateSetter,
  busyAction?: string,
): Promise<void> {
  mergeState(setState, {
    busy: true,
    txError: null,
    txHash: null,
    busyAction: busyAction ?? 'compound',
    txStage: 'pending',
  });
  
  try {
    const hash = await sdk.compound({
      validatorId,
      account,
    });
    mergeState(setState, { txHash: hash, busy: false, busyAction: null, txStage: 'submitted' });
    toast.success('Compound transaction submitted!');
    void waitForConfirmation(sdk, hash, setState);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    mergeState(setState, { txError: message, busy: false, busyAction: null, txStage: 'error' });
    toast.error(`Compound failed: ${message}`);
  }
}

export async function handleClaimRewards(
  sdk: MonadStakingSdk<Transport>,
  validatorId: bigint,
  account: `0x${string}`,
  setState: StakeStateSetter,
  busyAction?: string,
): Promise<void> {
  mergeState(setState, {
    busy: true,
    txError: null,
    txHash: null,
    busyAction: busyAction ?? 'claim',
    txStage: 'pending',
  });
  
  try {
    const hash = await sdk.claimRewards({
      validatorId,
      account,
    });
    mergeState(setState, { txHash: hash, busy: false, busyAction: null, txStage: 'submitted' });
    toast.success('Claim rewards transaction submitted!');
    void waitForConfirmation(sdk, hash, setState);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    mergeState(setState, { txError: message, busy: false, busyAction: null, txStage: 'error' });
    toast.error(`Claim rewards failed: ${message}`);
  }
}

async function waitForConfirmation(
  sdk: MonadStakingSdk<Transport>,
  hash: string,
  setState: StakeStateSetter,
) {
  try {
    await sdk.waitForTransactionReceipt(hash as `0x${string}`);
    setState((prev) => {
      if (prev.txHash !== hash) return prev;
      return { ...prev, txStage: 'confirmed' };
    });
    toast.success('Transaction confirmed on-chain.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to confirm transaction';
    setState((prev) => {
      if (prev.txHash !== hash) return prev;
      return { ...prev, txError: message, txStage: 'error' };
    });
    toast.error(`Confirmation error: ${message}`);
  }
}
