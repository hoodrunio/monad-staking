import type { MonadStakingSdk } from '@monad-staking/sdk';
import type { Transport } from 'viem';

export interface StakeFormData {
  validatorId: string;
  amountMon: string;
  withdrawId: number;
}

export interface TransactionContext {
  action: string;
  validatorId?: string;
  amount?: string;
  withdrawalId?: number;
}

export interface StakeFormState {
  txError: string | null;
  txHash: string | null;
  busy: boolean;
  busyAction: string | null;
  txStage: TransactionStage;
  txCount: number;
  txContext: TransactionContext | null;
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

function extractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Transaction failed';
  
  // Check for Viem error properties (shortMessage, details, etc.)
  const viemError = error as Error & { 
    shortMessage?: string; 
    details?: string;
    metaMessages?: string[];
  };
  
  // Use shortMessage if available (Viem's user-friendly error message)
  if (viemError.shortMessage) {
    return viemError.shortMessage;
  }
  
  const message = error.message;
  
  // Extract user-friendly message from common error patterns
  if (message.includes('User rejected') || message.includes('User denied')) {
    return 'You rejected the transaction.';
  }
  
  if (message.includes('insufficient funds')) {
    return 'Insufficient funds to complete this transaction.';
  }
  
  if (message.includes('gas required exceeds')) {
    return 'Gas estimation failed. The transaction may fail or require more gas.';
  }
  
  // Extract the first line/sentence for other errors
  const firstLine = message.split('\n')[0];
  if (firstLine && firstLine.length < 200) {
    return firstLine;
  }
  
  // Fallback for very long messages
  return 'Transaction failed. Please check your wallet for more details.';
}

export async function handleDelegate(
  sdk: MonadStakingSdk<Transport>,
  validatorId: bigint,
  amount: bigint,
  account: `0x${string}`,
  setState: StakeStateSetter,
  busyAction?: string,
): Promise<void> {
  const amountFormatted = `${Number(amount) / 1e18} MON`;
  mergeState(setState, {
    busy: true,
    txError: null,
    txHash: null,
    busyAction: busyAction ?? 'delegate',
    txStage: 'pending',
    txCount: 0,
    txContext: {
      action: busyAction ?? 'delegate',
      validatorId: validatorId.toString(),
      amount: amountFormatted,
    },
  });
  
  try {
    const hash = await sdk.delegate({
      validatorId,
      amount,
      account,
    });
    mergeState(setState, { txHash: hash, busy: false, busyAction: null, txStage: 'submitted', txCount: 1 });
    void waitForConfirmation(sdk, hash, setState);
  } catch (error) {
    const message = extractErrorMessage(error);
    mergeState(setState, { txError: message, busy: false, busyAction: null, txStage: 'error', txCount: 0 });
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
  const amountFormatted = `${Number(amount) / 1e18} MON`;
  mergeState(setState, {
    busy: true,
    txError: null,
    txHash: null,
    busyAction: busyAction ?? 'undelegate',
    txStage: 'pending',
    txCount: 0,
    txContext: {
      action: busyAction ?? 'undelegate',
      validatorId: validatorId.toString(),
      amount: amountFormatted,
      withdrawalId,
    },
  });
  
  try {
    const hash = await sdk.undelegate({
      validatorId,
      amount,
      withdrawalId,
      account,
    });
    mergeState(setState, { txHash: hash, busy: false, busyAction: null, txStage: 'submitted', txCount: 1 });
    void waitForConfirmation(sdk, hash, setState);
  } catch (error) {
    const message = extractErrorMessage(error);
    mergeState(setState, { txError: message, busy: false, busyAction: null, txStage: 'error', txCount: 0 });
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
    txCount: 0,
    txContext: {
      action: busyAction ?? 'withdraw',
      validatorId: validatorId.toString(),
      withdrawalId,
    },
  });
  
  try {
    const hash = await sdk.withdraw({
      validatorId,
      withdrawalId,
      account,
    });
    mergeState(setState, { txHash: hash, busy: false, busyAction: null, txStage: 'submitted', txCount: 1 });
    void waitForConfirmation(sdk, hash, setState);
  } catch (error) {
    const message = extractErrorMessage(error);
    mergeState(setState, { txError: message, busy: false, busyAction: null, txStage: 'error', txCount: 0 });
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
    txCount: 0,
    txContext: {
      action: busyAction ?? 'compound',
      validatorId: validatorId.toString(),
    },
  });
  
  try {
    const hash = await sdk.compound({
      validatorId,
      account,
    });
    mergeState(setState, { txHash: hash, busy: false, busyAction: null, txStage: 'submitted', txCount: 1 });
    void waitForConfirmation(sdk, hash, setState);
  } catch (error) {
    const message = extractErrorMessage(error);
    mergeState(setState, { txError: message, busy: false, busyAction: null, txStage: 'error', txCount: 0 });
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
    txCount: 0,
    txContext: {
      action: busyAction ?? 'claim',
      validatorId: validatorId.toString(),
    },
  });
  
  try {
    const hash = await sdk.claimRewards({
      validatorId,
      account,
    });
    mergeState(setState, { txHash: hash, busy: false, busyAction: null, txStage: 'submitted', txCount: 1 });
    void waitForConfirmation(sdk, hash, setState);
  } catch (error) {
    const message = extractErrorMessage(error);
    mergeState(setState, { txError: message, busy: false, busyAction: null, txStage: 'error', txCount: 0 });
  }
}

export async function handleClaimAllRewards(
  sdk: MonadStakingSdk<Transport>,
  account: `0x${string}`,
  setState: StakeStateSetter,
  busyAction?: string,
): Promise<void> {
  mergeState(setState, {
    busy: true,
    txError: null,
    txHash: null,
    busyAction: busyAction ?? 'claim-all',
    txStage: 'pending',
    txCount: 0,
    txContext: {
      action: busyAction ?? 'claim-all',
    },
  });

  try {
    const hashes = await sdk.claimAllRewards({ account });
    if (hashes.length === 0) {
      mergeState(setState, {
        busy: false,
        busyAction: null,
        txStage: 'idle',
        txHash: null,
        txError: null,
        txCount: 0,
        txContext: null,
      });
      return;
    }

    const [firstHash] = hashes;
    mergeState(setState, {
      txHash: firstHash,
      busy: false,
      busyAction: null,
      txStage: 'submitted',
      txCount: hashes.length,
    });

    void (async () => {
      try {
        await Promise.all(
          hashes.map((hash) => sdk.waitForTransactionReceipt(hash as `0x${string}`)),
        );
        mergeState(setState, { txStage: 'confirmed' });
      } catch (confirmationError) {
        const message = extractErrorMessage(confirmationError);
        mergeState(setState, { txError: message, txStage: 'error' });
      }
    })();
  } catch (error) {
    const message = extractErrorMessage(error);
    mergeState(setState, {
      txError: message,
      busy: false,
      busyAction: null,
      txStage: 'error',
      txCount: 0,
    });
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
  } catch (error) {
    const message = extractErrorMessage(error);
    setState((prev) => {
      if (prev.txHash !== hash) return prev;
      return { ...prev, txError: message, txStage: 'error' };
    });
  }
}
