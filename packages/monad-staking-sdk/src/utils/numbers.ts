export function toSafeNumber(value: bigint | number, fieldName: string): number {
  if (typeof value === 'bigint') {
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(`${fieldName} exceeds MAX_SAFE_INTEGER.`);
    }
    if (value < 0) {
      throw new Error(`${fieldName} cannot be negative.`);
    }
    return Number(value);
  }

  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer.`);
  }
  return value;
}
