import type { Address, Hash, TransactionReceipt, Transport } from 'viem';
import { parseEther } from 'viem';
import { BaseClient } from './base-client.js';
import { stakingAbi } from '../abi.js';
import { assertPositiveAmount, assertWithdrawalId, assertCommissionBounds } from '../validation/index.js';

/**
 * Default gas reserve for transactions (0.01 MON)
 * Used as fallback if estimation fails
 */
const DEFAULT_GAS_RESERVE = parseEther('0.01');

/**
 * Gas cost estimates for common operations
 */
export interface GasEstimate {
  /** Estimated gas units */
  gas: bigint;
  /** Estimated gas price in wei */
  gasPrice: bigint;
  /** Total estimated cost in wei (gas * gasPrice) */
  totalCost: bigint;
}

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

  // Gas Estimation Methods

  /**
   * Estimates gas cost for delegate transaction
   */
  async estimateDelegateGas(args: {
    readonly validatorId: bigint;
    readonly amount: bigint;
    readonly account: Address;
  }): Promise<GasEstimate> {
    try {
      const gasPrice = await this.publicClient.getGasPrice();
      
      const gas = await this.publicClient.estimateContractGas({
        address: this.address,
        abi: stakingAbi,
        functionName: 'delegate',
        args: [args.validatorId],
        value: args.amount,
        account: args.account,
      });

      // Add 20% buffer for safety
      const gasWithBuffer = (gas * 120n) / 100n;
      const totalCost = gasWithBuffer * gasPrice;

      return { gas: gasWithBuffer, gasPrice, totalCost };
    } catch {
      // Fallback to default reserve
      const gasPrice = await this.publicClient.getGasPrice();
      return {
        gas: DEFAULT_GAS_RESERVE / gasPrice,
        gasPrice,
        totalCost: DEFAULT_GAS_RESERVE,
      };
    }
  }

  /**
   * Estimates gas cost for undelegate transaction
   */
  async estimateUndelegateGas(args: {
    readonly validatorId: bigint;
    readonly amount: bigint;
    readonly withdrawalId: number;
    readonly account: Address;
  }): Promise<GasEstimate> {
    try {
      const gasPrice = await this.publicClient.getGasPrice();
      
      const gas = await this.publicClient.estimateContractGas({
        address: this.address,
        abi: stakingAbi,
        functionName: 'undelegate',
        args: [args.validatorId, args.amount, Number(args.withdrawalId)],
        account: args.account,
      });

      const gasWithBuffer = (gas * 120n) / 100n;
      const totalCost = gasWithBuffer * gasPrice;

      return { gas: gasWithBuffer, gasPrice, totalCost };
    } catch {
      const gasPrice = await this.publicClient.getGasPrice();
      return {
        gas: DEFAULT_GAS_RESERVE / gasPrice,
        gasPrice,
        totalCost: DEFAULT_GAS_RESERVE,
      };
    }
  }

  /**
   * Estimates gas cost for withdraw transaction
   */
  async estimateWithdrawGas(args: {
    readonly validatorId: bigint;
    readonly withdrawalId: number;
    readonly account: Address;
  }): Promise<GasEstimate> {
    try {
      const gasPrice = await this.publicClient.getGasPrice();
      
      const gas = await this.publicClient.estimateContractGas({
        address: this.address,
        abi: stakingAbi,
        functionName: 'withdraw',
        args: [args.validatorId, Number(args.withdrawalId)],
        account: args.account,
      });

      const gasWithBuffer = (gas * 120n) / 100n;
      const totalCost = gasWithBuffer * gasPrice;

      return { gas: gasWithBuffer, gasPrice, totalCost };
    } catch {
      const gasPrice = await this.publicClient.getGasPrice();
      return {
        gas: DEFAULT_GAS_RESERVE / gasPrice,
        gasPrice,
        totalCost: DEFAULT_GAS_RESERVE,
      };
    }
  }

  /**
   * Estimates gas cost for claimRewards transaction
   */
  async estimateClaimRewardsGas(args: {
    readonly validatorId: bigint;
    readonly account: Address;
  }): Promise<GasEstimate> {
    try {
      const gasPrice = await this.publicClient.getGasPrice();
      
      const gas = await this.publicClient.estimateContractGas({
        address: this.address,
        abi: stakingAbi,
        functionName: 'claimRewards',
        args: [args.validatorId],
        account: args.account,
      });

      const gasWithBuffer = (gas * 120n) / 100n;
      const totalCost = gasWithBuffer * gasPrice;

      return { gas: gasWithBuffer, gasPrice, totalCost };
    } catch {
      const gasPrice = await this.publicClient.getGasPrice();
      return {
        gas: DEFAULT_GAS_RESERVE / gasPrice,
        gasPrice,
        totalCost: DEFAULT_GAS_RESERVE,
      };
    }
  }

  /**
   * Calculates maximum stakeable amount considering gas costs
   */
  async calculateMaxStakeableAmount(args: {
    readonly validatorId: bigint;
    readonly balance: bigint;
    readonly account: Address;
  }): Promise<bigint> {
    try {
      // Estimate gas for a minimal delegation to get gas cost
      const estimate = await this.estimateDelegateGas({
        validatorId: args.validatorId,
        amount: parseEther('0.001'), // Minimal amount for estimation
        account: args.account,
      });

      // Reserve gas cost from balance
      const maxStakeable = args.balance - estimate.totalCost;
      
      // Ensure we don't return negative values
      return maxStakeable > 0n ? maxStakeable : 0n;
    } catch {
      // Fallback: reserve default amount
      const reserved = args.balance - DEFAULT_GAS_RESERVE;
      return reserved > 0n ? reserved : 0n;
    }
  }
}
