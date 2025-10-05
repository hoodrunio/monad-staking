import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import { createMonadStakingSdk } from '@monad-staking/sdk';
import { createPublicClient, defineChain, http, type PublicClient, type Transport, type Chain } from 'viem';
import type { Delegation, DelegationPage } from '../../domain/delegation';
import type { Withdrawal } from '../../domain/withdrawal';

export interface BlockchainClient {
  getValidator(id: bigint): Promise<{
    authAddress: string;
    secpPubkey: string;
    blsPubkey: string;
    commission: bigint;
    stake: bigint;
    consensusStake: bigint;
    snapshotStake: bigint;
    unclaimedRewards: bigint;
    flags: bigint;
  }>;
  getEpoch(): Promise<{ epoch: bigint; inEpochDelayPeriod: boolean }>;
  getExecutionValidatorSet(cursor: number): Promise<{ validatorIds: readonly bigint[]; isDone: boolean; nextIndex: number }>;
  getSnapshotValidatorSet(cursor: number): Promise<{ validatorIds: readonly bigint[]; isDone: boolean; nextIndex: number }>;
  getConsensusValidatorSet(cursor: number): Promise<{ validatorIds: readonly bigint[]; isDone: boolean; nextIndex: number }>;
  getDelegations(address: `0x${string}`, cursor: bigint): Promise<DelegationPage>;
  getDelegator(validatorId: bigint, address: `0x${string}`): Promise<Delegation>;
  getWithdrawal(validatorId: bigint, address: `0x${string}`, withdrawalId: number): Promise<Withdrawal | null>;
  getBalance(address: `0x${string}`): Promise<bigint>;
  getBlockNumber(): Promise<bigint>;
}

export class MonadSdkClient implements BlockchainClient {
  private sdk: ReturnType<typeof createMonadStakingSdk>;
  private publicClient: PublicClient<Transport, Chain, undefined>;

  constructor(config: ResolvedMonadNetworkConfig) {
    const chain = defineChain({
      id: config.chainId,
      name: config.label,
      network: config.key,
      nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
      rpcUrls: {
        default: { http: [config.rpcUrl] },
        public: { http: [config.rpcUrl] },
      },
    });

    this.publicClient = createPublicClient<Transport, Chain, undefined>({
      chain,
      transport: http(config.rpcUrl),
    });

    this.sdk = createMonadStakingSdk({ network: config, publicClient: this.publicClient });
  }

  async getValidator(id: bigint) {
    return await this.sdk.getValidator(id);
  }

  async getEpoch() {
    return await this.sdk.getEpoch();
  }

  async getExecutionValidatorSet(cursor: number) {
    return await this.sdk.getExecutionValidatorSet(cursor);
  }

  async getSnapshotValidatorSet(cursor: number) {
    return await this.sdk.getSnapshotValidatorSet(cursor);
  }

  async getConsensusValidatorSet(cursor: number) {
    return await this.sdk.getConsensusValidatorSet(cursor);
  }

  async getDelegations(address: `0x${string}`, cursor: bigint): Promise<DelegationPage> {
    const page = await this.sdk.getDelegations(address, cursor);
    return {
      items: page.validatorIds.map(validatorId => ({ validatorId })),
      nextCursor: page.nextValId,
      isDone: page.isDone,
    };
  }

  async getDelegator(validatorId: bigint, address: `0x${string}`): Promise<Delegation> {
    const result = await this.sdk.getDelegator(validatorId, address);
    return {
      validatorId,
      delegatorAddress: address,
      stake: result.stake,
      unclaimedRewards: result.unclaimedRewards,
      deltaStake: result.deltaStake,
      nextDeltaStake: result.nextDeltaStake,
      deltaEpoch: result.deltaEpoch,
      nextDeltaEpoch: result.nextDeltaEpoch,
    };
  }

  async getWithdrawal(validatorId: bigint, address: `0x${string}`, withdrawalId: number): Promise<Withdrawal | null> {
    try {
      const result = await this.sdk.getWithdrawalRequest(validatorId, address, withdrawalId);
      if (result.withdrawalAmount === 0n) return null;
      return {
        validatorId,
        delegatorAddress: address,
        withdrawalId,
        amount: result.withdrawalAmount,
        accRewardPerToken: result.accRewardPerToken,
        withdrawEpoch: result.withdrawEpoch,
      };
    } catch {
      return null;
    }
  }

  async getBalance(address: `0x${string}`): Promise<bigint> {
    return await this.publicClient.getBalance({ address });
  }

  async getBlockNumber(): Promise<bigint> {
    return await this.publicClient.getBlockNumber();
  }
}
