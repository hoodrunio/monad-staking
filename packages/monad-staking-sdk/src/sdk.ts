import type { Address, Hash, Log, TransactionReceipt, Transport, WalletClient } from 'viem';
import type {
  MonadStakingSdkOptions,
  EpochInfo,
  ValidatorInfo,
  DelegatorInfo,
  WithdrawalRequestInfo,
  PaginatedValidatorSet,
  PaginatedDelegations,
  PaginatedDelegators,
  ActivationEpochInfo,
  WithdrawEpochInfo,
} from './types/index.js';
import { ReadClient, WriteClient, EventClient, type GasEstimate } from './client/index.js';

export type { GasEstimate };

/**
 * Main SDK class that provides a unified interface to interact with the Monad staking precompile.
 * 
 * The SDK is composed of three specialized clients:
 * - ReadClient: All view/read operations
 * - WriteClient: All state-changing transactions
 * - EventClient: Event watching and historical event queries
 */
export class MonadStakingSdk<TTransport extends Transport> {
  private readonly readClient: ReadClient<TTransport>;
  private readonly writeClient: WriteClient<TTransport>;
  private readonly eventClient: EventClient<TTransport>;

  constructor(options: MonadStakingSdkOptions<TTransport>) {
    this.readClient = new ReadClient(options);
    this.writeClient = new WriteClient(options);
    this.eventClient = new EventClient(options);
  }

  // Accessors
  get network() {
    return this.readClient.network;
  }

  get address() {
    return this.readClient.address;
  }

  setWalletClient(client: WalletClient<TTransport>): void {
    this.readClient.setWalletClient(client);
    this.writeClient.setWalletClient(client);
    this.eventClient.setWalletClient(client);
  }

  // Read Operations
  async getEpoch(): Promise<EpochInfo> {
    return this.readClient.getEpoch();
  }

  async getValidator(validatorId: bigint): Promise<ValidatorInfo> {
    return this.readClient.getValidator(validatorId);
  }

  async getDelegator(validatorId: bigint, delegator: Address): Promise<DelegatorInfo> {
    return this.readClient.getDelegator(validatorId, delegator);
  }

  async getWithdrawalRequest(
    validatorId: bigint,
    delegator: Address,
    withdrawalId: number,
  ): Promise<WithdrawalRequestInfo> {
    return this.readClient.getWithdrawalRequest(validatorId, delegator, withdrawalId);
  }

  async getConsensusValidatorSet(startIndex = 0): Promise<PaginatedValidatorSet> {
    return this.readClient.getConsensusValidatorSet(startIndex);
  }

  async getSnapshotValidatorSet(startIndex = 0): Promise<PaginatedValidatorSet> {
    return this.readClient.getSnapshotValidatorSet(startIndex);
  }

  async getExecutionValidatorSet(startIndex = 0): Promise<PaginatedValidatorSet> {
    return this.readClient.getExecutionValidatorSet(startIndex);
  }

  async getDelegations(delegator: Address, startValId: bigint): Promise<PaginatedDelegations> {
    return this.readClient.getDelegations(delegator, startValId);
  }

  async getDelegators(validatorId: bigint, startDelegator: Address): Promise<PaginatedDelegators> {
    return this.readClient.getDelegators(validatorId, startDelegator);
  }

  async calculateActivationEpoch(): Promise<ActivationEpochInfo> {
    return this.readClient.calculateActivationEpoch();
  }

  async calculateWithdrawEpoch(): Promise<WithdrawEpochInfo> {
    return this.readClient.calculateWithdrawEpoch();
  }

  // Write Operations
  async delegate(args: {
    readonly validatorId: bigint;
    readonly amount: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    return this.writeClient.delegate(args);
  }

  async undelegate(args: {
    readonly validatorId: bigint;
    readonly amount: bigint;
    readonly withdrawalId: number;
    readonly account: Address;
  }): Promise<Hash> {
    return this.writeClient.undelegate(args);
  }

  async withdraw(args: {
    readonly validatorId: bigint;
    readonly withdrawalId: number;
    readonly account: Address;
  }): Promise<Hash> {
    return this.writeClient.withdraw(args);
  }

  async compound(args: {
    readonly validatorId: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    return this.writeClient.compound(args);
  }

  async claimRewards(args: {
    readonly validatorId: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    return this.writeClient.claimRewards(args);
  }

  async claimAllRewards(args: { readonly account: Address }): Promise<Hash[]> {
    return this.writeClient.claimAllRewards(args);
  }

  async changeCommission(args: {
    readonly validatorId: bigint;
    readonly newCommission: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    return this.writeClient.changeCommission(args);
  }

  async externalReward(args: {
    readonly validatorId: bigint;
    readonly account: Address;
  }): Promise<Hash> {
    return this.writeClient.externalReward(args);
  }

  async waitForTransactionReceipt(hash: Hash): Promise<TransactionReceipt> {
    return this.writeClient.waitForTransactionReceipt(hash);
  }

  // Event Operations - Watch (real-time)
  watchValidatorCreated(
    args: { validatorId?: bigint; authAddress?: Address },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.eventClient.watchValidatorCreated(args, onLogs);
  }

  watchValidatorStatusChanged(
    args: { validatorId?: bigint; authAddress?: Address },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.eventClient.watchValidatorStatusChanged(args, onLogs);
  }

  watchDelegate(
    args: { validatorId?: bigint; delegator?: Address },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.eventClient.watchDelegate(args, onLogs);
  }

  watchUndelegate(
    args: { validatorId?: bigint; delegator?: Address },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.eventClient.watchUndelegate(args, onLogs);
  }

  watchWithdraw(
    args: { validatorId?: bigint; delegator?: Address },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.eventClient.watchWithdraw(args, onLogs);
  }

  watchClaimRewards(
    args: { validatorId?: bigint; delegator?: Address },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.eventClient.watchClaimRewards(args, onLogs);
  }

  watchCommissionChanged(
    args: { validatorId?: bigint },
    onLogs: (logs: Log[]) => void,
  ) {
    return this.eventClient.watchCommissionChanged(args, onLogs);
  }

  // Event Operations - Get (historical)
  async getValidatorCreatedEvents(args: {
    validatorId?: bigint;
    authAddress?: Address;
    fromBlock?: bigint;
    toBlock?: bigint;
  } = {}) {
    return this.eventClient.getValidatorCreatedEvents(args);
  }

  async getDelegateEvents(args: {
    validatorId?: bigint;
    delegator?: Address;
    fromBlock?: bigint;
    toBlock?: bigint;
  } = {}) {
    return this.eventClient.getDelegateEvents(args);
  }

  async getUndelegateEvents(args: {
    validatorId?: bigint;
    delegator?: Address;
    fromBlock?: bigint;
    toBlock?: bigint;
  } = {}) {
    return this.eventClient.getUndelegateEvents(args);
  }

  async getWithdrawEvents(args: {
    validatorId?: bigint;
    delegator?: Address;
    fromBlock?: bigint;
    toBlock?: bigint;
  } = {}) {
    return this.eventClient.getWithdrawEvents(args);
  }

  async getClaimRewardsEvents(args: {
    validatorId?: bigint;
    delegator?: Address;
    fromBlock?: bigint;
    toBlock?: bigint;
  } = {}) {
    return this.eventClient.getClaimRewardsEvents(args);
  }

  async getCommissionChangedEvents(args: {
    validatorId?: bigint;
    fromBlock?: bigint;
    toBlock?: bigint;
  } = {}) {
    return this.eventClient.getCommissionChangedEvents(args);
  }

  // Gas Estimation Operations
  async estimateDelegateGas(args: {
    readonly validatorId: bigint;
    readonly amount: bigint;
    readonly account: Address;
  }): Promise<GasEstimate> {
    return this.writeClient.estimateDelegateGas(args);
  }

  async estimateUndelegateGas(args: {
    readonly validatorId: bigint;
    readonly amount: bigint;
    readonly withdrawalId: number;
    readonly account: Address;
  }): Promise<GasEstimate> {
    return this.writeClient.estimateUndelegateGas(args);
  }

  async estimateWithdrawGas(args: {
    readonly validatorId: bigint;
    readonly withdrawalId: number;
    readonly account: Address;
  }): Promise<GasEstimate> {
    return this.writeClient.estimateWithdrawGas(args);
  }

  async estimateClaimRewardsGas(args: {
    readonly validatorId: bigint;
    readonly account: Address;
  }): Promise<GasEstimate> {
    return this.writeClient.estimateClaimRewardsGas(args);
  }

  async calculateMaxStakeableAmount(args: {
    readonly validatorId: bigint;
    readonly balance: bigint;
    readonly account: Address;
  }): Promise<bigint> {
    return this.writeClient.calculateMaxStakeableAmount(args);
  }
}

export function createMonadStakingSdk<TTransport extends Transport>(
  options: MonadStakingSdkOptions<TTransport>,
): MonadStakingSdk<TTransport> {
  return new MonadStakingSdk(options);
}
