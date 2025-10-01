import type { Address, Log, Transport } from 'viem';
import { BaseClient } from './base-client.js';
import { stakingAbi } from '../abi.js';

export class EventClient<TTransport extends Transport> extends BaseClient<TTransport> {
  watchValidatorCreated(
    args: {
      validatorId?: bigint;
      authAddress?: Address;
    },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.publicClient.watchContractEvent({
      address: this.address,
      abi: stakingAbi,
      eventName: 'ValidatorCreated',
      args,
      onLogs,
    });
  }

  watchValidatorStatusChanged(
    args: {
      validatorId?: bigint;
      authAddress?: Address;
    },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.publicClient.watchContractEvent({
      address: this.address,
      abi: stakingAbi,
      eventName: 'ValidatorStatusChanged',
      args,
      onLogs,
    });
  }

  watchDelegate(
    args: {
      validatorId?: bigint;
      delegator?: Address;
    },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.publicClient.watchContractEvent({
      address: this.address,
      abi: stakingAbi,
      eventName: 'Delegate',
      args,
      onLogs,
    });
  }

  watchUndelegate(
    args: {
      validatorId?: bigint;
      delegator?: Address;
    },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.publicClient.watchContractEvent({
      address: this.address,
      abi: stakingAbi,
      eventName: 'Undelegate',
      args,
      onLogs,
    });
  }

  watchWithdraw(
    args: {
      validatorId?: bigint;
      delegator?: Address;
    },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.publicClient.watchContractEvent({
      address: this.address,
      abi: stakingAbi,
      eventName: 'Withdraw',
      args,
      onLogs,
    });
  }

  watchClaimRewards(
    args: {
      validatorId?: bigint;
      delegator?: Address;
    },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.publicClient.watchContractEvent({
      address: this.address,
      abi: stakingAbi,
      eventName: 'ClaimRewards',
      args,
      onLogs,
    });
  }

  watchCommissionChanged(
    args: {
      validatorId?: bigint;
    },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.publicClient.watchContractEvent({
      address: this.address,
      abi: stakingAbi,
      eventName: 'CommissionChanged',
      args,
      onLogs,
    });
  }

  async getValidatorCreatedEvents(
    args: {
      validatorId?: bigint;
      authAddress?: Address;
      fromBlock?: bigint;
      toBlock?: bigint;
    } = {},
  ) {
    return this.publicClient.getContractEvents({
      address: this.address,
      abi: stakingAbi,
      eventName: 'ValidatorCreated',
      args: { validatorId: args.validatorId, authAddress: args.authAddress },
      fromBlock: args.fromBlock,
      toBlock: args.toBlock,
    });
  }

  async getDelegateEvents(
    args: {
      validatorId?: bigint;
      delegator?: Address;
      fromBlock?: bigint;
      toBlock?: bigint;
    } = {},
  ) {
    return this.publicClient.getContractEvents({
      address: this.address,
      abi: stakingAbi,
      eventName: 'Delegate',
      args: { validatorId: args.validatorId, delegator: args.delegator },
      fromBlock: args.fromBlock,
      toBlock: args.toBlock,
    });
  }

  async getUndelegateEvents(
    args: {
      validatorId?: bigint;
      delegator?: Address;
      fromBlock?: bigint;
      toBlock?: bigint;
    } = {},
  ) {
    return this.publicClient.getContractEvents({
      address: this.address,
      abi: stakingAbi,
      eventName: 'Undelegate',
      args: { validatorId: args.validatorId, delegator: args.delegator },
      fromBlock: args.fromBlock,
      toBlock: args.toBlock,
    });
  }

  async getWithdrawEvents(
    args: {
      validatorId?: bigint;
      delegator?: Address;
      fromBlock?: bigint;
      toBlock?: bigint;
    } = {},
  ) {
    return this.publicClient.getContractEvents({
      address: this.address,
      abi: stakingAbi,
      eventName: 'Withdraw',
      args: { validatorId: args.validatorId, delegator: args.delegator },
      fromBlock: args.fromBlock,
      toBlock: args.toBlock,
    });
  }

  async getClaimRewardsEvents(
    args: {
      validatorId?: bigint;
      delegator?: Address;
      fromBlock?: bigint;
      toBlock?: bigint;
    } = {},
  ) {
    return this.publicClient.getContractEvents({
      address: this.address,
      abi: stakingAbi,
      eventName: 'ClaimRewards',
      args: { validatorId: args.validatorId, delegator: args.delegator },
      fromBlock: args.fromBlock,
      toBlock: args.toBlock,
    });
  }

  async getCommissionChangedEvents(
    args: {
      validatorId?: bigint;
      fromBlock?: bigint;
      toBlock?: bigint;
    } = {},
  ) {
    return this.publicClient.getContractEvents({
      address: this.address,
      abi: stakingAbi,
      eventName: 'CommissionChanged',
      args: { validatorId: args.validatorId },
      fromBlock: args.fromBlock,
      toBlock: args.toBlock,
    });
  }
}
