import type { Address, Hash, TransactionReceipt, Transport } from 'viem';
import { BaseClient } from './base-client.js';
import { stakingAbi } from '../abi.js';
import { assertPositiveAmount, assertWithdrawalId, assertCommissionBounds } from '../validation/index.js';

export class WriteClient<TTransport extends Transport> extends BaseClient<TTransport> {
  async delegate(args: {
    readonly validatorId: bigint;
    readonly amount: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    assertPositiveAmount(args.amount, 'Delegation amount');
    const walletClient = this.requireWalletClient();
    return walletClient.writeContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'delegate',
      args: [args.validatorId],
      value: args.amount,
      account: args.account,
      chain: walletClient.chain ?? undefined,
    });
  }

  async undelegate(args: {
    readonly validatorId: bigint;
    readonly amount: bigint;
    readonly withdrawalId: number;
    readonly account: Address;
  }): Promise<Hash> {
    assertPositiveAmount(args.amount, 'Undelegation amount');
    assertWithdrawalId(args.withdrawalId);
    const walletClient = this.requireWalletClient();
    return walletClient.writeContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'undelegate',
      args: [args.validatorId, args.amount, Number(args.withdrawalId)],
      account: args.account,
      chain: walletClient.chain ?? undefined,
    });
  }

  async withdraw(args: {
    readonly validatorId: bigint;
    readonly withdrawalId: number;
    readonly account: Address;
  }): Promise<Hash> {
    assertWithdrawalId(args.withdrawalId);
    const walletClient = this.requireWalletClient();
    return walletClient.writeContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'withdraw',
      args: [args.validatorId, Number(args.withdrawalId)],
      account: args.account,
      chain: walletClient.chain ?? undefined,
    });
  }

  async compound(args: {
    readonly validatorId: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    const walletClient = this.requireWalletClient();
    return walletClient.writeContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'compound',
      args: [args.validatorId],
      account: args.account,
      chain: walletClient.chain ?? undefined,
    });
  }

  async claimRewards(args: {
    readonly validatorId: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    const walletClient = this.requireWalletClient();
    return walletClient.writeContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'claimRewards',
      args: [args.validatorId],
      account: args.account,
      chain: walletClient.chain ?? undefined,
    });
  }

  async claimAllRewards(args: { readonly account: Address }): Promise<Hash[]> {
    const walletClient = this.requireWalletClient();
    const results: Hash[] = [];
    let startValId = 0n;
    let isDone = false;

    while (!isDone) {
      const [_isDone, nextValId, valIds] = await this.callFunction('getDelegations', [args.account, startValId]);
      isDone = _isDone;
      startValId = nextValId;

      for (const validatorId of valIds) {
        const [, , unclaimedRewards] = await this.callFunction('getDelegator', [validatorId, args.account]);
        if (unclaimedRewards <= 0n) continue;
        
        const hash = await walletClient.writeContract({
          address: this.address,
          abi: stakingAbi,
          functionName: 'claimRewards',
          args: [validatorId],
          account: args.account,
          chain: walletClient.chain ?? undefined,
        });
        results.push(hash);
      }
    }

    return results;
  }

  async changeCommission(args: {
    readonly validatorId: bigint;
    readonly newCommission: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    assertCommissionBounds(args.newCommission);
    const walletClient = this.requireWalletClient();
    return walletClient.writeContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'changeCommission',
      args: [args.validatorId, args.newCommission],
      account: args.account,
      chain: walletClient.chain ?? undefined,
    });
  }

  async externalReward(args: {
    readonly validatorId: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    const walletClient = this.requireWalletClient();
    return walletClient.writeContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'externalReward',
      args: [args.validatorId],
      account: args.account,
      chain: walletClient.chain ?? undefined,
    });
  }

  async waitForTransactionReceipt(hash: Hash): Promise<TransactionReceipt> {
    return this.publicClient.waitForTransactionReceipt({ hash });
  }
}
