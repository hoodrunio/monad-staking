export function assertPositiveAmount(amount: bigint, label: string): void {
  if (amount <= 0n) {
    throw new Error(`${label} must be greater than zero.`);
  }
}
