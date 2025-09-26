import type { AmountField, CommissionField } from './api-types';

const MON_DECIMALS = 18n;
const ONE_MON = 10n ** MON_DECIMALS;

function formatBigIntWithDecimals(
  value: bigint,
  decimals: bigint,
  fractionDigits: number,
): string {
  if (value === 0n) return '0';

  const sign = value < 0n ? '-' : '';
  const absolute = value < 0n ? -value : value;
  const integer = absolute / (10n ** decimals);
  const fraction = absolute % (10n ** decimals);

  if (fractionDigits === 0) {
    return `${sign}${integer.toString()}`;
  }

  const fractionStr = fraction
    .toString()
    .padStart(Number(decimals), '0')
    .slice(0, fractionDigits)
    .replace(/0+$/, '');

  if (!fractionStr) {
    return `${sign}${integer.toString()}`;
  }

  return `${sign}${integer.toString()}.${fractionStr}`;
}

export function formatMon(value: bigint, fractionDigits = 4): string {
  return `${formatBigIntWithDecimals(value, MON_DECIMALS, fractionDigits)} MON`;
}

export function formatCommission(commission: bigint): string {
  // commission is scaled by 1e18
  const scaled = (commission * 10000n) / ONE_MON; // basis points * 100
  const integer = scaled / 100n;
  const fraction = scaled % 100n;
  const fractionStr = fraction.toString().padStart(2, '0').replace(/0+$/, '');
  return fractionStr
    ? `${integer.toString()}.${fractionStr}%`
    : `${integer.toString()}%`;
}

export function formatAmountField(amount: AmountField | undefined, options?: { suffix?: string; fallback?: string }): string {
  const base = amount && amount.decimal !== '' ? amount.decimal : options?.fallback ?? '0';
  const suffix = options?.suffix ?? ' MON';
  return suffix ? `${base}${suffix}` : base;
}

export function formatCommissionField(commission: CommissionField | undefined, options?: { suffix?: string; fallback?: string }): string {
  const base = commission && commission.percent !== '' ? commission.percent : options?.fallback ?? '0';
  const suffix = options?.suffix ?? '%';
  return `${base}${suffix}`;
}

export function truncateAddress(address: string, size = 6): string {
  if (address.length <= size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function formatBigInt(value: bigint): string {
  return value.toString();
}
