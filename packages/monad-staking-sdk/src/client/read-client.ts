import type { Address, Transport } from 'viem';
import { BaseClient } from './base-client.js';
import type {
  DelegatorInfo,
  EpochInfo,
  PaginatedDelegations,
  PaginatedDelegators,
  PaginatedValidatorSet,
  ValidatorInfo,
  WithdrawalRequestInfo,
  ActivationEpochInfo,
  WithdrawEpochInfo,
} from '../types/index.js';
import { assertWithdrawalId } from '../validation/index.js';
import { toSafeNumber } from '../utils/index.js';

export class ReadClient<TTransport extends Transport> extends BaseClient<TTransport> {
  async getEpoch(): Promise<EpochInfo> {
    const [epoch, inEpochDelayPeriod] = await this.callFunction('getEpoch', []);
    return { epoch, inEpochDelayPeriod };
  }

  async getValidator(validatorId: bigint): Promise<ValidatorInfo> {
    const [
      authAddress,
      flags,
      stake,
      accRewardPerToken,
      commission,
      unclaimedRewards,
      consensusStake,
      consensusCommission,
      snapshotStake,
      snapshotCommission,
      secpPubkey,
      blsPubkey,
    ] = await this.callFunction('getValidator', [validatorId]);

    return {
      authAddress,
      flags,
      stake,
      accRewardPerToken,
      commission,
      unclaimedRewards,
      consensusStake,
      consensusCommission,
      snapshotStake,
      snapshotCommission,
      secpPubkey,
      blsPubkey,
    };
  }

  async getDelegator(
    validatorId: bigint,
    delegator: Address,
  ): Promise<DelegatorInfo> {
    const [
      stake,
      accRewardPerToken,
      unclaimedRewards,
      deltaStake,
      nextDeltaStake,
      deltaEpoch,
      nextDeltaEpoch,
    ] = await this.callFunction('getDelegator', [validatorId, delegator]);

    return {
      stake,
      accRewardPerToken,
      unclaimedRewards,
      deltaStake,
      nextDeltaStake,
      deltaEpoch,
      nextDeltaEpoch,
    };
  }

  async getWithdrawalRequest(
    validatorId: bigint,
    delegator: Address,
    withdrawalId: number,
  ): Promise<WithdrawalRequestInfo> {
    assertWithdrawalId(withdrawalId);
    const [withdrawalAmount, accRewardPerToken, withdrawEpoch] = await this.callFunction(
      'getWithdrawalRequest',
      [validatorId, delegator, Number(withdrawalId)],
    );
    return { withdrawalAmount, accRewardPerToken, withdrawEpoch };
  }

  async getConsensusValidatorSet(
    startIndex = 0,
  ): Promise<PaginatedValidatorSet> {
    return this.readValidatorSet('getConsensusValidatorSet', startIndex);
  }

  async getSnapshotValidatorSet(
    startIndex = 0,
  ): Promise<PaginatedValidatorSet> {
    return this.readValidatorSet('getSnapshotValidatorSet', startIndex);
  }

  async getExecutionValidatorSet(
    startIndex = 0,
  ): Promise<PaginatedValidatorSet> {
    return this.readValidatorSet('getExecutionValidatorSet', startIndex);
  }

  async getDelegations(
    delegator: Address,
    startValId: bigint,
  ): Promise<PaginatedDelegations> {
    const [isDone, nextValId, valIds] = await this.callFunction(
      'getDelegations',
      [delegator, startValId],
    );
    return {
      isDone,
      nextValId,
      validatorIds: valIds,
    };
  }

  async getDelegators(
    validatorId: bigint,
    startDelegator: Address,
  ): Promise<PaginatedDelegators> {
    const [isDone, nextDelegator, delegators] = await this.callFunction(
      'getDelegators',
      [validatorId, startDelegator],
    );
    return {
      isDone,
      nextDelegator,
      delegators,
    };
  }

  async calculateActivationEpoch(): Promise<ActivationEpochInfo> {
    const { epoch, inEpochDelayPeriod } = await this.getEpoch();
    const activationEpoch = epoch + (inEpochDelayPeriod ? 2n : 1n);
    const reason = inEpochDelayPeriod
      ? 'Request is in epoch delay period, activation occurs in epoch n+2'
      : 'Request is before boundary block, activation occurs in epoch n+1';

    return {
      activationEpoch,
      currentEpoch: epoch,
      inEpochDelayPeriod,
      reason,
    };
  }

  async calculateWithdrawEpoch(): Promise<WithdrawEpochInfo> {
    const { epoch, inEpochDelayPeriod } = await this.getEpoch();
    const withdrawalDelay = this.network.withdrawalDelay;
    const withdrawEpoch = epoch + (inEpochDelayPeriod ? 2n : 1n) + BigInt(withdrawalDelay);
    const reason = inEpochDelayPeriod
      ? `Request is in epoch delay period, stake becomes inactive in epoch n+2, withdrawable after ${withdrawalDelay} epoch(s) in epoch n+${2 + withdrawalDelay}`
      : `Request is before boundary block, stake becomes inactive in epoch n+1, withdrawable after ${withdrawalDelay} epoch(s) in epoch n+${1 + withdrawalDelay}`;

    return {
      withdrawEpoch,
      currentEpoch: epoch,
      inEpochDelayPeriod,
      withdrawalDelay,
      reason,
    };
  }

  private async readValidatorSet(
    functionName: 'getConsensusValidatorSet' | 'getSnapshotValidatorSet' | 'getExecutionValidatorSet',
    startIndex: number,
  ): Promise<PaginatedValidatorSet> {
    if (startIndex < 0) {
      throw new Error('startIndex must be non-negative.');
    }

    const [isDone, nextIndex, valIds] = await this.callFunction(functionName, [startIndex]);
    return {
      isDone,
      nextIndex: toSafeNumber(nextIndex, `${functionName}.nextIndex`),
      validatorIds: valIds,
    };
  }
}
