import { logger } from '../infrastructure';

export type AmountField = {
  raw: string;
  decimal: string;
};

export type CommissionField = {
  raw: string;
  rate: string;
  percent: string;
  basisPoints: string;
};

function formatDecimal(value: bigint, decimals: number, maxFractionDigits = decimals): string {
  const sign = value < 0n ? '-' : '';
  const abs = value < 0n ? -value : value;
  const base = 10n ** BigInt(decimals);
  const integer = abs / base;
  let fraction = (abs % base).toString().padStart(decimals, '0');
  if (maxFractionDigits < decimals) {
    fraction = fraction.slice(0, maxFractionDigits);
  }
  fraction = fraction.replace(/0+$/, '');
  if (!fraction) return `${sign}${integer.toString()}`;
  return `${sign}${integer.toString()}.${fraction}`;
}

export function normalizeAmount(value: bigint | string): AmountField {
  const bigint = ensureBigInt(value);
  return {
    raw: bigint.toString(),
    decimal: formatDecimal(bigint, 18, 6),
  };
}

export function normalizeCommission(value: bigint | string): CommissionField {
  const bigint = ensureBigInt(value);
  const percent = (bigint * 100n);
  const basisPoints = (bigint * 10_000n) / (10n ** 18n);
  return {
    raw: bigint.toString(),
    rate: formatDecimal(bigint, 18, 6),
    percent: formatDecimal(percent, 18, 4),
    basisPoints: basisPoints.toString(),
  };
}

export function ensureBigInt(value: bigint | string): bigint {
  if (typeof value === 'bigint') return value;
  try {
    return BigInt(value);
  } catch (err) {
    logger.warn('failed to coerce bigint', { value, error: err instanceof Error ? err.message : String(err) });
    return 0n;
  }
}

export function decimalFromRaw(raw: string): string {
  return normalizeAmount(raw).decimal;
}
