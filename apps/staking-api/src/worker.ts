import { container } from './shared/container';
import { logger } from './infrastructure';
import { workerConfig } from './config/env';
import type { Network } from './domain/types';

const BASE_DELAY_MS = workerConfig.pollMs;
const MAX_DELAY_MS = workerConfig.pollMaxMs;
const MIN_DELAY_MS = workerConfig.pollMinMs;
const INGEST_MAX_RETRIES = workerConfig.ingestMaxRetries;

async function pollNetwork(network: Network) {
  const networkConfig = container.getNetworkConfig(network);
  if (!networkConfig) {
    logger.warn('worker.skip.network', { network });
    return;
  }

  const blockchainClient = container.getBlockchainClient(network);
  if (!blockchainClient) {
    logger.warn('worker.skip.no_client', { network });
    return;
  }

  const epochRepo = container['epochRepo'];

  let lastEpoch: string | null = null;
  let backoffMs = BASE_DELAY_MS;
  let delayStateLogged = false;

  logger.info('worker.poll.start', { network, pollMs: BASE_DELAY_MS });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const cycleStart = Date.now();
    try {
      const epochInfo = await blockchainClient.getEpoch();
      const epochBig = epochInfo.epoch;
      const epochStr = epochBig.toString();

      await epochRepo.save({
        network,
        epoch: epochBig,
        inDelayPeriod: epochInfo.inEpochDelayPeriod,
        updatedAt: new Date(),
      });

      if (epochInfo.inEpochDelayPeriod) {
        if (!delayStateLogged) {
          logger.info('worker.epoch.delay', { network, epoch: epochStr });
          delayStateLogged = true;
        }
      } else {
        if (delayStateLogged) {
          logger.info('worker.epoch.delay_cleared', { network, epoch: epochStr });
          delayStateLogged = false;
        }

        if (lastEpoch !== epochStr) {
          logger.info('worker.epoch.transition', { network, epoch: epochStr });
          await runIngestWithRetry(network, epochStr);
          lastEpoch = epochStr;
        }
      }

      backoffMs = BASE_DELAY_MS;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('worker.poll.error', { network, error: message });
      backoffMs = Math.min(backoffMs * 2, MAX_DELAY_MS);
    }

    const elapsed = Date.now() - cycleStart;
    const sleepFor = Math.max(backoffMs - elapsed, MIN_DELAY_MS);
    await sleep(sleepFor);
  }
}

async function runIngestWithRetry(network: Network, epoch: string) {
  for (let attempt = 0; attempt <= INGEST_MAX_RETRIES; attempt++) {
    try {
      const useCase = container.ingestValidators(network);
      await useCase.execute(network);
      logger.info('worker.ingest.success', { network, epoch, attempt });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn('worker.ingest.retry', { network, epoch, attempt, error: message });
      if (attempt === INGEST_MAX_RETRIES) {
        logger.error('worker.ingest.failed', { network, epoch, error: message });
        return;
      }
      const backoff = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
      await sleep(backoff);
    }
  }
}

async function main() {
  await container.initialize();
  logger.info('worker.container_initialized');

  const networks: Network[] = ['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2'];
  const activeNetworks = networks.filter((n) => container.getNetworkConfig(n) !== null);

  if (activeNetworks.length === 0) {
    logger.warn('worker.no_networks');
    return;
  }

  await Promise.all(activeNetworks.map((network) => pollNetwork(network)));
}

main().catch((error) => {
  logger.error('worker.fatal', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
