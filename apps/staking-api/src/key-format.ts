export function normalizeHexNo0x(value: string): string | null {
  const trimmed = value.trim();
  const noPrefix = trimmed.startsWith('0x') || trimmed.startsWith('0X') ? trimmed.slice(2) : trimmed;
  if (noPrefix.length === 0 || noPrefix.length % 2 !== 0) return null;
  if (!/^[0-9a-fA-F]+$/.test(noPrefix)) return null;
  return noPrefix.toLowerCase();
}

export function normalizeSecpKey(value: string): string | null {
  const normalized = normalizeHexNo0x(value);
  if (!normalized) return null;
  if (normalized.length !== 66) return null;
  const prefix = normalized.slice(0, 2);
  if (prefix !== '02' && prefix !== '03') return null;
  return normalized;
}

export function ensure0x(value: string): `0x${string}` {
  if (value.startsWith('0x') || value.startsWith('0X')) {
    return `0x${value.slice(2).toLowerCase()}` as `0x${string}`;
  }
  return `0x${value.toLowerCase()}` as `0x${string}`;
}

export function normalizeAddress(input: string): string | null {
  const normalized = normalizeHexNo0x(input);
  if (!normalized || normalized.length !== 40) return null;
  return normalized;
}
