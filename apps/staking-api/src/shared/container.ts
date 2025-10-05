import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import { loadMonadNetworkConfig, requireNetworkConfig, MONAD_NETWORK_KEYS } from '@monad-staking/config';
import { validatorsCol, epochCol, ingestStateCol } from '../infrastructure';
import { MongoValidatorRepository } from '../infrastructure/repositories/validator.repo';
import { MongoEpochRepository } from '../infrastructure/repositories/epoch.repo';
import { MongoIngestRepository } from '../infrastructure/repositories/ingest.repo';
import { MonadSdkClient } from '../infrastructure/blockchain/sdk.client';
import { MonadGithubClient } from '../infrastructure/external/github.client';
import { HybridCacheService, MemoryCacheService } from '../infrastructure/cache/cache.service';
import { ListValidatorsUseCase } from '../application/validators/list';
import { GetValidatorDetailUseCase } from '../application/validators/get-detail';
import { IngestValidatorsUseCase } from '../application/validators/ingest';
import { ListDelegationsUseCase } from '../application/delegations/list';
import { ListWithdrawalsUseCase } from '../application/withdrawals/list';
import { GetEpochUseCase } from '../application/epoch/get';
import { GetBalanceUseCase } from '../application/balance/get';
import type { Network } from '../domain/types';

export interface Container {
  listValidators: ListValidatorsUseCase;
  getValidatorDetail(network: Network): GetValidatorDetailUseCase;
  ingestValidators(network: Network): IngestValidatorsUseCase;
  listDelegations(network: Network): ListDelegationsUseCase;
  listWithdrawals(network: Network): ListWithdrawalsUseCase;
  getEpoch(network: Network): GetEpochUseCase;
  getBalance(network: Network): GetBalanceUseCase;
  epochRepo: MongoEpochRepository;
  getNetworkConfig(network: Network): ResolvedMonadNetworkConfig | null;
  getBlockchainClient(network: Network): MonadSdkClient | null;
}

class DIContainer implements Container {
  private initialized = false;
  private validatorRepo!: MongoValidatorRepository;
  public epochRepo!: MongoEpochRepository;
  private ingestRepo!: MongoIngestRepository;
  private blockchainClients: Map<Network, MonadSdkClient> = new Map();
  private githubClient!: MonadGithubClient;
  private listValidatorsCache!: HybridCacheService;
  private validatorDetailCache!: HybridCacheService;
  private delegationsCache!: HybridCacheService;
  private withdrawalsCache!: MemoryCacheService;
  private epochCache!: HybridCacheService;
  private balanceCache!: HybridCacheService;
  private networkConfigs: Map<Network, ResolvedMonadNetworkConfig> = new Map();

  public listValidators!: ListValidatorsUseCase;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.validatorRepo = new MongoValidatorRepository(await validatorsCol());
    this.epochRepo = new MongoEpochRepository(await epochCol());
    this.ingestRepo = new MongoIngestRepository(await ingestStateCol());

    const map = loadMonadNetworkConfig();
    for (const key of MONAD_NETWORK_KEYS) {
      try {
        const config = requireNetworkConfig(map, key);
        this.networkConfigs.set(key, config);
        this.blockchainClients.set(key, new MonadSdkClient(config));
      } catch {
        // Network not configured
      }
    }

    this.githubClient = new MonadGithubClient();

    this.listValidatorsCache = new HybridCacheService('validators:list', 30);
    this.validatorDetailCache = new HybridCacheService('validators:detail', 120);
    this.delegationsCache = new HybridCacheService('delegations', 20);
    this.withdrawalsCache = new MemoryCacheService(20_000);
    this.epochCache = new HybridCacheService('epoch', 10);
    this.balanceCache = new HybridCacheService('balance', 10);

    this.listValidators = new ListValidatorsUseCase(this.validatorRepo, this.listValidatorsCache);

    this.initialized = true;
  }

  getBlockchainClient(network: Network): MonadSdkClient | null {
    return this.blockchainClients.get(network) ?? null;
  }

  getNetworkConfig(network: Network): ResolvedMonadNetworkConfig | null {
    return this.networkConfigs.get(network) ?? null;
  }

  getValidatorDetail(network: Network): GetValidatorDetailUseCase {
    const client = this.getBlockchainClient(network);
    if (!client) throw new Error(`Network ${network} not configured`);
    return new GetValidatorDetailUseCase(this.validatorRepo, client, this.validatorDetailCache);
  }

  ingestValidators(network: Network): IngestValidatorsUseCase {
    const client = this.getBlockchainClient(network);
    if (!client) throw new Error(`Network ${network} not configured`);
    return new IngestValidatorsUseCase(this.validatorRepo, this.ingestRepo, client, this.githubClient);
  }

  listDelegations(network: Network): ListDelegationsUseCase {
    const client = this.getBlockchainClient(network);
    if (!client) throw new Error(`Network ${network} not configured`);
    return new ListDelegationsUseCase(client, this.delegationsCache);
  }

  listWithdrawals(network: Network): ListWithdrawalsUseCase {
    const client = this.getBlockchainClient(network);
    if (!client) throw new Error(`Network ${network} not configured`);
    return new ListWithdrawalsUseCase(client, this.withdrawalsCache);
  }

  getEpoch(network: Network): GetEpochUseCase {
    const client = this.getBlockchainClient(network);
    if (!client) throw new Error(`Network ${network} not configured`);
    return new GetEpochUseCase(client, this.epochCache, this.epochRepo);
  }

  getBalance(network: Network): GetBalanceUseCase {
    const client = this.getBlockchainClient(network);
    if (!client) throw new Error(`Network ${network} not configured`);
    return new GetBalanceUseCase(client, this.balanceCache);
  }
}

export const container = new DIContainer();
