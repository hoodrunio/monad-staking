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
  setState: (state: Partial<StakeFormState>) => void,
  busyAction?: string,
): Promise<void> {
  setState({ busy: true, txError: null, txHash: null, busyAction: busyAction ?? 'delegate' });
  
  try {
    const hash = await sdk.delegate({
      validatorId,
      amount,
      account,
    });
    setState({ txHash: hash, busy: false, busyAction: null });
    toast.success('Delegation transaction submitted!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    setState({ txError: message, busy: false, busyAction: null });
    toast.error(`Delegation failed: ${message}`);
  }
}

export async function handleUndelegate(
  sdk: MonadStakingSdk<Transport>,
  validatorId: bigint,
  amount: bigint,
  withdrawalId: number,
  account: `0x${string}`,
  setState: (state: Partial<StakeFormState>) => void,
  busyAction?: string,
): Promise<void> {
  setState({ busy: true, txError: null, txHash: null, busyAction: busyAction ?? 'undelegate' });
  
  try {
    const hash = await sdk.undelegate({
      validatorId,
      amount,
      withdrawalId,
      account,
    });
    setState({ txHash: hash, busy: false, busyAction: null });
    toast.success('Undelegation transaction submitted!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    setState({ txError: message, busy: false, busyAction: null });
    toast.error(`Undelegation failed: ${message}`);
  }
}

export async function handleWithdraw(
  sdk: MonadStakingSdk<Transport>,
  validatorId: bigint,
  withdrawalId: number,
  account: `0x${string}`,
  setState: (state: Partial<StakeFormState>) => void,
  busyAction?: string,
): Promise<void> {
  setState({ busy: true, txError: null, txHash: null, busyAction: busyAction ?? 'withdraw' });
  
  try {
    const hash = await sdk.withdraw({
      validatorId,
      withdrawalId,
      account,
    });
    setState({ txHash: hash, busy: false, busyAction: null });
    toast.success('Withdrawal transaction submitted!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    setState({ txError: message, busy: false, busyAction: null });
    toast.error(`Withdrawal failed: ${message}`);
  }
}

export async function handleCompound(
  sdk: MonadStakingSdk<Transport>,
  validatorId: bigint,
  account: `0x${string}`,
  setState: (state: Partial<StakeFormState>) => void,
  busyAction?: string,
): Promise<void> {
  setState({ busy: true, txError: null, txHash: null, busyAction: busyAction ?? 'compound' });
  
  try {
    const hash = await sdk.compound({
      validatorId,
      account,
    });
    setState({ txHash: hash, busy: false, busyAction: null });
    toast.success('Compound transaction submitted!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    setState({ txError: message, busy: false, busyAction: null });
    toast.error(`Compound failed: ${message}`);
  }
}

export async function handleClaimRewards(
  sdk: MonadStakingSdk<Transport>,
  validatorId: bigint,
  account: `0x${string}`,
  setState: (state: Partial<StakeFormState>) => void,
  busyAction?: string,
): Promise<void> {
  setState({ busy: true, txError: null, txHash: null, busyAction: busyAction ?? 'claim' });
  
  try {
    const hash = await sdk.claimRewards({
      validatorId,
      account,
    });
    setState({ txHash: hash, busy: false, busyAction: null });
    toast.success('Claim rewards transaction submitted!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    setState({ txError: message, busy: false, busyAction: null });
    toast.error(`Claim rewards failed: ${message}`);
  }
}
