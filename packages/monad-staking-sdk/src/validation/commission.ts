export function assertCommissionBounds(commission: bigint): void {
  const max = 1_000_000_000_000_000_000n; // 1e18
  if (commission < 0n || commission > max) {
    throw new Error('commission must be expressed in 1e18 units between 0 and 1e18 inclusive.');
  }
}
