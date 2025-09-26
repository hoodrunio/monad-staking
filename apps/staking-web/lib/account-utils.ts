import { formatMonFromWei } from './utils';
import type { DelegationSummary, WithdrawalSummary } from './api/models';

export function formatDelegationRow(delegation: DelegationSummary) {
  return {
    validatorId: delegation.validatorId,
    stake: delegation.stake.formatted,
    unclaimedRewards: delegation.unclaimedRewards.formatted,
    pendingChanges: {
      deltaStake: delegation.deltaStakeRaw,
      nextDeltaStake: delegation.nextDeltaStakeRaw,
      deltaEpoch: delegation.deltaEpoch,
      nextDeltaEpoch: delegation.nextDeltaEpoch,
    },
  };
}

export function formatWithdrawalRow(withdrawal: WithdrawalSummary) {
  return {
    validatorId: withdrawal.validatorId,
    withdrawalId: withdrawal.withdrawalId,
    amount:
      withdrawal.amount.formatted || formatMonFromWei(withdrawal.amount.raw),
    withdrawEpoch: withdrawal.withdrawEpoch,
    canWithdraw: (currentEpoch: bigint) =>
      BigInt(withdrawal.withdrawEpoch) < currentEpoch,
  };
}
