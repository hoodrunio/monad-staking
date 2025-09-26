import type {
  Address,
  Hash,
  PublicClient,
  TransactionReceipt,
  Transport,
  WalletClient,
} from 'viem';
import { stakingAbi } from './abi.js';
import {
  MONAD_STAKING_PRECOMPILE_ADDRESS,
  type MonadNetwork,
  type MonadNetworkConfigMap,
  type ResolvedMonadNetworkConfig,
  loadMonadNetworkConfig,
  requireNetworkConfig,
} from '@monad-staking/config';

export { stakingAbi };

export interface MonadStakingSdkOptions<TTransport extends Transport> {
  readonly network: ResolvedMonadNetworkConfig;
  readonly publicClient: PublicClient<TTransport>;
  readonly walletClient?: WalletClient<TTransport>;
}

function assertSameChain(
  config: ResolvedMonadNetworkConfig,
  clientChainId?: number,
  clientType?: 'public' | 'wallet',
) {
  if (!clientChainId) return;
  if (clientChainId !== config.chainId) {
    const origin = clientType ? `${clientType} client` : 'client';
    throw new Error(
      `${origin} (chainId=${clientChainId}) does not match configured Monad network (chainId=${config.chainId}).`,
    );
  }
}

function toSafeNumber(value: bigint | number, fieldName: string): number {
  if (typeof value === 'bigint') {
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(`${fieldName} exceeds MAX_SAFE_INTEGER.`);
    }
    if (value < 0) {
      throw new Error(`${fieldName} cannot be negative.`);
    }
    return Number(value);
  }

  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer.`);
  }
  return value;
}

function assertPositiveAmount(amount: bigint, label: string) {
  if (amount <= 0n) {
    throw new Error(`${label} must be greater than zero.`);
  }
}

function assertWithdrawalId(withdrawalId: number | bigint) {
  const value = typeof withdrawalId === 'bigint' ? withdrawalId : BigInt(withdrawalId);
  if (value === 0n || value > 255n) {
    throw new Error('withdrawalId must be between 1 and 255.');
  }
}

function assertCommissionBounds(commission: bigint) {
  const max = 1_000_000_000_000_000_000n; // 1e18
  if (commission < 0n || commission > max) {
    throw new Error('commission must be expressed in 1e18 units between 0 and 1e18 inclusive.');
  }
}

function assertExternalRewardBounds(amount: bigint) {
  const min = 1_000_000_000_000_000_000n; // 1 MON (1e18 wei)
  const max = 1_000_000_000_000_000_000_000n; // 1,000,000 MON (1e24 wei)
  if (amount < min || amount > max) {
    throw new Error('external reward amount must be between 1 and 1,000,000 MON (inclusive).');
  }
}

export interface EpochInfo {
  readonly epoch: bigint;
  readonly inEpochDelayPeriod: boolean;
}

export interface ValidatorInfo {
  readonly authAddress: Address;
  readonly flags: bigint;
  readonly stake: bigint;
  readonly accRewardPerToken: bigint;
  readonly commission: bigint;
  readonly unclaimedRewards: bigint;
  readonly consensusStake: bigint;
  readonly consensusCommission: bigint;
  readonly snapshotStake: bigint;
  readonly snapshotCommission: bigint;
  readonly secpPubkey: `0x${string}`;
  readonly blsPubkey: `0x${string}`;
}

export interface DelegatorInfo {
  readonly stake: bigint;
  readonly accRewardPerToken: bigint;
  readonly unclaimedRewards: bigint;
  readonly deltaStake: bigint;
  readonly nextDeltaStake: bigint;
  readonly deltaEpoch: bigint;
  readonly nextDeltaEpoch: bigint;
}

export interface WithdrawalRequestInfo {
  readonly withdrawalAmount: bigint;
  readonly accRewardPerToken: bigint;
  readonly withdrawEpoch: bigint;
}

export interface PaginatedValidatorSet {
  readonly isDone: boolean;
  readonly nextIndex: number;
  readonly validatorIds: readonly bigint[];
}

export interface PaginatedDelegations {
  readonly isDone: boolean;
  readonly nextValId: bigint;
  readonly validatorIds: readonly bigint[];
}

export interface PaginatedDelegators {
  readonly isDone: boolean;
  readonly nextDelegator: Address;
  readonly delegators: readonly Address[];
}

export class MonadStakingSdk<TTransport extends Transport> {
  private walletClient?: WalletClient<TTransport>;

  constructor(
    private readonly options: MonadStakingSdkOptions<TTransport>,
  ) {
    assertSameChain(
      options.network,
      options.publicClient.chain?.id,
      'public',
    );
    if (options.walletClient) {
      assertSameChain(
        options.network,
        options.walletClient.chain?.id,
        'wallet',
      );
      this.walletClient = options.walletClient;
    }
  }

  get network(): ResolvedMonadNetworkConfig {
    return this.options.network;
  }

  get address(): typeof MONAD_STAKING_PRECOMPILE_ADDRESS {
    return this.options.network.precompileAddress;
  }

  setWalletClient(client: WalletClient<TTransport>) {
    assertSameChain(this.options.network, client.chain?.id, 'wallet');
    this.walletClient = client;
  }

  async getEpoch(): Promise<EpochInfo> {
    const result = (await this.options.publicClient.readContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'getEpoch',
    })) as [bigint, boolean];
    const [epoch, inEpochDelayPeriod] = result;
    return { epoch, inEpochDelayPeriod };
  }

  async getValidator(validatorId: bigint): Promise<ValidatorInfo> {
    const result = (await this.options.publicClient.readContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'getValidator',
      args: [validatorId],
    })) as [
      Address,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      `0x${string}`,
      `0x${string}`,
    ];

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
    ] = result;

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
    const result = (await this.options.publicClient.readContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'getDelegator',
      args: [validatorId, delegator],
    })) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint];

    const [
      stake,
      accRewardPerToken,
      unclaimedRewards,
      deltaStake,
      nextDeltaStake,
      deltaEpoch,
      nextDeltaEpoch,
    ] = result;

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
    const result = (await this.options.publicClient.readContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'getWithdrawalRequest',
      args: [validatorId, delegator, Number(withdrawalId)],
    })) as [bigint, bigint, bigint];

    const [withdrawalAmount, accRewardPerToken, withdrawEpoch] = result;
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
    const result = (await this.options.publicClient.readContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'getDelegations',
      args: [delegator, startValId],
    })) as [boolean, bigint, readonly bigint[]];

    const [isDone, nextValId, valIds] = result;
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
    const result = (await this.options.publicClient.readContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'getDelegators',
      args: [validatorId, startDelegator],
    })) as [boolean, Address, readonly Address[]];

    const [isDone, nextDelegator, delegators] = result;
    return {
      isDone,
      nextDelegator,
      delegators,
    };
  }

  private async readValidatorSet(
    functionName: 'getConsensusValidatorSet' | 'getSnapshotValidatorSet' | 'getExecutionValidatorSet',
    startIndex: number,
  ): Promise<PaginatedValidatorSet> {
    if (startIndex < 0) {
      throw new Error('startIndex must be non-negative.');
    }

    const result = (await this.options.publicClient.readContract({
      address: this.address,
      abi: stakingAbi,
      functionName,
      args: [startIndex],
    })) as [boolean, number, readonly bigint[]];

    const [isDone, nextIndex, valIds] = result;
    return {
      isDone,
      nextIndex: toSafeNumber(nextIndex, `${functionName}.nextIndex`),
      validatorIds: valIds,
    };
  }

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
    const delegations = await this.getDelegations(args.account, 0n);
    const results: Hash[] = [];
    for (const validatorId of delegations.validatorIds) {
      const delegator = await this.getDelegator(validatorId, args.account);
      if (delegator.unclaimedRewards <= 0n) continue;
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
    readonly amount: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    assertExternalRewardBounds(args.amount);
    const walletClient = this.requireWalletClient();
    return walletClient.writeContract({
      address: this.address,
      abi: stakingAbi,
      functionName: 'externalReward',
      args: [args.validatorId],
      value: args.amount,
      account: args.account,
      chain: walletClient.chain ?? undefined,
    });
  }

  private requireWalletClient(): WalletClient<TTransport> {
    if (!this.walletClient) {
      throw new Error('Wallet client is not configured. Call setWalletClient or provide one during construction.');
    }
    return this.walletClient;
  }

  async waitForTransactionReceipt(hash: Hash): Promise<TransactionReceipt> {
    return this.options.publicClient.waitForTransactionReceipt({ hash });
  }
}

export function createMonadStakingSdk<TTransport extends Transport>(
  options: MonadStakingSdkOptions<TTransport>,
) {
  return new MonadStakingSdk(options);
}

export function loadMonadNetworks(
  env: NodeJS.ProcessEnv = process.env,
): MonadNetworkConfigMap {
  return loadMonadNetworkConfig(env);
}

export function resolveMonadNetwork(
  configs: MonadNetworkConfigMap,
  network: MonadNetwork,
): ResolvedMonadNetworkConfig {
  return requireNetworkConfig(configs, network);
}
