export function assertWithdrawalId(withdrawalId: number | bigint): void {
  const value = typeof withdrawalId === 'bigint' ? withdrawalId : BigInt(withdrawalId);
  if (value === 0n || value > 255n) {
    throw new Error('withdrawalId must be between 1 and 255.');
  }
}
