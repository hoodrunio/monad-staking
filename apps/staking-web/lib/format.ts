import type { AmountField, CommissionField } from './api/types';

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

export function formatMonCompact(value: bigint, fractionDigits = 1): string {
  const decimal = Number(formatBigIntWithDecimals(value, MON_DECIMALS, 2));
  
  if (decimal >= 1_000_000_000) {
    return `${(decimal / 1_000_000_000).toFixed(fractionDigits)}B MON`;
  }
  if (decimal >= 1_000_000) {
    return `${(decimal / 1_000_000).toFixed(fractionDigits)}M MON`;
  }
  if (decimal >= 1_000) {
    return `${(decimal / 1_000).toFixed(fractionDigits)}K MON`;
  }
  return `${decimal.toFixed(fractionDigits)} MON`;
}

/**
 * Formats large MON amounts from number with compact notation (B, M, K)
 * Useful for displaying large decimal numbers in limited space
 */
export function formatMonCompactFromNumber(value: number, fractionDigits = 1): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(fractionDigits)}B MON`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(fractionDigits)}M MON`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(fractionDigits)}K MON`;
  }
  return `${value.toFixed(fractionDigits)} MON`;
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

export function formatCompactMonFromDecimal(decimal: string | undefined, fractionDigits = 3): string {
  if (!decimal || decimal.length === 0) return '0 MON';
  const negative = decimal.startsWith('-');
  const normalized = negative ? decimal.slice(1) : decimal;
  const [integerPart = '0', fractionalPart = ''] = normalized.split('.');

  let formattedInteger: string;
  try {
    formattedInteger = BigInt(integerPart || '0').toLocaleString();
  } catch {
    const num = Number(integerPart || '0');
    formattedInteger = Number.isFinite(num) ? num.toLocaleString() : integerPart;
  }

  const trimmedFraction = fractionalPart.slice(0, fractionDigits).replace(/0+$/, '');
  const body = trimmedFraction ? `${formattedInteger}.${trimmedFraction}` : formattedInteger;
  return `${negative ? '-' : ''}${body} MON`;
}

export function truncateAddress(address: string, size = 6): string {
  if (address.length <= size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function formatBigInt(value: bigint): string {
  return value.toString();
}
