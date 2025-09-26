import { formatMonFromWei } from './utils';

export function formatDelegationRow(delegation: {
  validatorId: string;
  stake: string;
  stakeRaw: string;
  unclaimedRewards: string;
  unclaimedRewardsRaw: string;
  deltaStake: string;
  nextDeltaStake: string;
  deltaEpoch: string;
  nextDeltaEpoch: string;
}) {
  return {
    validatorId: delegation.validatorId,
    stake: delegation.stake,
    unclaimedRewards: delegation.unclaimedRewards,
    pendingChanges: {
      deltaStake: delegation.deltaStake,
      nextDeltaStake: delegation.nextDeltaStake,
      deltaEpoch: delegation.deltaEpoch,
      nextDeltaEpoch: delegation.nextDeltaEpoch,
    }
  };
}

export function formatWithdrawalRow(withdrawal: {
  validatorId: string;
  withdrawalId: number;
  amount: string;
  amountDisplay: string;
  withdrawEpoch: string;
}) {
  return {
    validatorId: withdrawal.validatorId,
    withdrawalId: withdrawal.withdrawalId,
    amount: withdrawal.amountDisplay || formatMonFromWei(withdrawal.amount),
    withdrawEpoch: withdrawal.withdrawEpoch,
    canWithdraw: (currentEpoch: bigint) => BigInt(withdrawal.withdrawEpoch) < currentEpoch,
  };
}
