import toast from 'react-hot-toast';
import type { MonadStakingSdk } from '@monad-staking/sdk';

export interface StakeFormData {
  validatorId: string;
  amountMon: string;
  withdrawId: number;
}

export interface StakeFormState {
  txError: string | null;
  txHash: string | null;
  busy: boolean;
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
  sdk: MonadStakingSdk | null,
  account: `0x${string}` | undefined,
  validatorBig: bigint,
  amountWei: bigint,
  busy: boolean
): boolean {
  return Boolean(sdk && account && validatorBig > 0n && amountWei > 0n && !busy);
}

export async function handleDelegate(
  sdk: MonadStakingSdk,
  validatorId: bigint,
  amount: bigint,
  setState: (state: Partial<StakeFormState>) => void
): Promise<void> {
  setState({ busy: true, txError: null, txHash: null });
  
  try {
    const hash = await sdk.delegate(validatorId, { value: amount });
    setState({ txHash: hash, busy: false });
    toast.success('Delegation transaction submitted!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    setState({ txError: message, busy: false });
    toast.error(`Delegation failed: ${message}`);
  }
}

export async function handleUndelegate(
  sdk: MonadStakingSdk,
  validatorId: bigint,
  amount: bigint,
  withdrawId: number,
  setState: (state: Partial<StakeFormState>) => void
): Promise<void> {
  setState({ busy: true, txError: null, txHash: null });
  
  try {
    const hash = await sdk.undelegate(validatorId, amount, withdrawId);
    setState({ txHash: hash, busy: false });
    toast.success('Undelegation transaction submitted!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    setState({ txError: message, busy: false });
    toast.error(`Undelegation failed: ${message}`);
  }
}

export async function handleWithdraw(
  sdk: MonadStakingSdk,
  validatorId: bigint,
  withdrawId: number,
  setState: (state: Partial<StakeFormState>) => void
): Promise<void> {
  setState({ busy: true, txError: null, txHash: null });
  
  try {
    const hash = await sdk.withdraw(validatorId, withdrawId);
    setState({ txHash: hash, busy: false });
    toast.success('Withdrawal transaction submitted!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    setState({ txError: message, busy: false });
    toast.error(`Withdrawal failed: ${message}`);
  }
}

export async function handleCompound(
  sdk: MonadStakingSdk,
  validatorId: bigint,
  setState: (state: Partial<StakeFormState>) => void
): Promise<void> {
  setState({ busy: true, txError: null, txHash: null });
  
  try {
    const hash = await sdk.compound(validatorId);
    setState({ txHash: hash, busy: false });
    toast.success('Compound transaction submitted!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    setState({ txError: message, busy: false });
    toast.error(`Compound failed: ${message}`);
  }
}

export async function handleClaimRewards(
  sdk: MonadStakingSdk,
  validatorId: bigint,
  setState: (state: Partial<StakeFormState>) => void
): Promise<void> {
  setState({ busy: true, txError: null, txHash: null });
  
  try {
    const hash = await sdk.claimRewards(validatorId);
    setState({ txHash: hash, busy: false });
    toast.success('Claim rewards transaction submitted!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    setState({ txError: message, busy: false });
    toast.error(`Claim rewards failed: ${message}`);
  }
}
