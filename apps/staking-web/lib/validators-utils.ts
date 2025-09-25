export function normalizeCursor(param: string | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] ?? '' : param;
}

export function formatShortAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
