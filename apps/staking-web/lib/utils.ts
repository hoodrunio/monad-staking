import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';

export function getExplorerUrl(config: ResolvedMonadNetworkConfig, type: 'address' | 'tx', value: string): string | null {
  if (!config.explorerBaseUrl) return null;
  const base = config.explorerBaseUrl.replace(/\/$/, '');
  switch (type) {
    case 'address':
      return `${base}/address/${value}`;
    case 'tx':
      return `${base}/tx/${value}`;
    default:
      return null;
  }
}

export function formatEffectiveEpoch(
  currentEpoch: bigint,
  inEpochDelayPeriod: boolean,
  actionType: 'delegate' | 'undelegate'
): string {
  const effectiveEpoch = inEpochDelayPeriod 
    ? currentEpoch + 2n 
    : currentEpoch + 1n;
  
  const action = actionType === 'delegate' ? 'active' : 'inactive';
  return `Will be ${action} in epoch ${effectiveEpoch.toString()}`;
}

export function formatWithdrawableEpoch(
  currentEpoch: bigint,
  inEpochDelayPeriod: boolean,
  withdrawalDelay: number
): string {
  const inactiveEpoch = inEpochDelayPeriod 
    ? currentEpoch + 2n 
    : currentEpoch + 1n;
  
  const withdrawableEpoch = inactiveEpoch + BigInt(withdrawalDelay);
  return `Withdrawable in epoch ${withdrawableEpoch.toString()}`;
}

// Find available withdrawal IDs
export function findAvailableWithdrawIds(usedIds: number[]): number[] {
  const available: number[] = [];
  for (let id = 1; id <= 255; id++) {
    if (!usedIds.includes(id)) {
      available.push(id);
    }
  }
  return available;
}

export function getNextAvailableWithdrawId(usedIds: number[]): number | null {
  const available = findAvailableWithdrawIds(usedIds);
  return available.length > 0 ? available[0] : null;
}

function toBigInt(value: string | bigint): bigint {
  return typeof value === 'string' ? BigInt(value) : value;
}

export function formatMonFromWei(value: string | bigint, fractionDigits = 4): string {
  const big = toBigInt(value);
  const base = 10n ** 18n;
  const integer = big / base;
  const remainder = big % base;
  if (fractionDigits <= 0) return `${integer.toString()} MON`;
  const scaled = remainder.toString().padStart(18, '0');
  const fraction = scaled.slice(0, fractionDigits).replace(/0+$/, '');
  return fraction ? `${integer.toString()}.${fraction} MON` : `${integer.toString()} MON`;
}

export function monWeiToDecimalString(value: string | bigint, fractionDigits = 6): string {
  const big = toBigInt(value);
  const base = 10n ** 18n;
  const integer = big / base;
  if (fractionDigits <= 0) return integer.toString();
  const remainder = big % base;
  const scaled = remainder.toString().padStart(18, '0');
  const fraction = scaled.slice(0, fractionDigits).replace(/0+$/, '');
  return fraction ? `${integer.toString()}.${fraction}` : integer.toString();
}

export function parseFormattedMon(value: string): string {
  return value.replace(/[^0-9.]/g, '');
}
