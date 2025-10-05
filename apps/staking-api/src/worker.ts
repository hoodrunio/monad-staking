import { container } from './shared/container';
import { logger } from './infrastructure';
import { workerConfig } from './config/env';
import type { Network } from './domain/types';
import type { Epoch, EpochSample } from './domain/epoch';

interface EpochInfo {
  epoch: bigint;
  inEpochDelayPeriod: boolean;
}

const BASE_DELAY_MS = workerConfig.pollMs;
const MAX_DELAY_MS = workerConfig.pollMaxMs;
const MIN_DELAY_MS = workerConfig.pollMinMs;
const INGEST_MAX_RETRIES = workerConfig.ingestMaxRetries;
const AVERAGE_BLOCK_TIME_MS = 500;

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
  let epochState: Epoch | null = await epochRepo.get(network);
  let backoffMs = BASE_DELAY_MS;
  let pendingIngestEpoch: string | null = null;

  logger.info('worker.poll.start', { network, pollMs: BASE_DELAY_MS });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const cycleStart = Date.now();
    try {
      const observedAt = new Date();
      const [epochInfo, blockNumber] = await Promise.all([
        blockchainClient.getEpoch(),
        blockchainClient.getBlockNumber(),
      ]);
      const wasInDelay = epochState?.inDelayPeriod ?? false;

      const { state: updatedState, epochAdvanced } = updateEpochState({
        network,
        info: epochInfo,
        observedAt,
        blockNumber,
        previousState: epochState,
      });

      await epochRepo.save(updatedState);
      epochState = updatedState;

      const epochStr = updatedState.epoch.toString();

      if (!wasInDelay && updatedState.inDelayPeriod) {
        logger.info('worker.epoch.delay', { network, epoch: epochStr });
      } else if (wasInDelay && !updatedState.inDelayPeriod) {
        logger.info('worker.epoch.delay_cleared', { network, epoch: epochStr });
      }

      if (epochAdvanced) {
        logger.info('worker.epoch.transition', { network, epoch: epochStr });
        if (updatedState.inDelayPeriod) {
          pendingIngestEpoch = epochStr;
        } else {
          await runIngestWithRetry(network, epochStr);
          pendingIngestEpoch = null;
        }
      } else if (pendingIngestEpoch && !updatedState.inDelayPeriod && pendingIngestEpoch === epochStr) {
        await runIngestWithRetry(network, epochStr);
        pendingIngestEpoch = null;
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

const MAX_EPOCH_SAMPLES = 12;

interface UpdateEpochStateArgs {
  network: Network;
  info: EpochInfo;
  observedAt: Date;
  blockNumber: bigint;
  previousState: Epoch | null;
}

interface UpdateEpochStateResult {
  state: Epoch;
  epochAdvanced: boolean;
}

function updateEpochState(args: UpdateEpochStateArgs): UpdateEpochStateResult {
  const { network, info, observedAt, blockNumber, previousState } = args;
  const epochAdvanced = !previousState || previousState.epoch !== info.epoch;

  if (epochAdvanced) {
    const summary = summarizePreviousEpoch(previousState, observedAt, blockNumber);
    const delayStartedAt = info.inEpochDelayPeriod ? observedAt : null;

    const state: Epoch = {
      network,
      epoch: info.epoch,
      inDelayPeriod: info.inEpochDelayPeriod,
      updatedAt: observedAt,
      epochStartedAt: observedAt,
      delayStartedAt,
      epochStartBlock: blockNumber,
      lastBlockNumber: blockNumber,
      lastBlockUpdatedAt: observedAt,
      lastEpochDurationMs: summary.lastEpochDurationMs,
      lastEpochActiveDurationMs: summary.lastEpochActiveDurationMs,
      lastEpochDelayDurationMs: summary.lastEpochDelayDurationMs,
      avgEpochDurationMs: summary.avgEpochDurationMs,
      avgActiveDurationMs: summary.avgActiveDurationMs,
      avgDelayDurationMs: summary.avgDelayDurationMs,
      samples: summary.samples,
    };

    return { state, epochAdvanced: true };
  }

  if (!previousState) {
    throw new Error('Epoch state is required when epoch has not advanced');
  }

  const epochStartedAt = previousState.epochStartedAt ?? observedAt;
  const delayStartedAt = previousState.delayStartedAt ?? (info.inEpochDelayPeriod ? observedAt : null);

  const state: Epoch = {
    ...previousState,
    inDelayPeriod: info.inEpochDelayPeriod,
    updatedAt: observedAt,
    epochStartedAt,
    delayStartedAt,
    epochStartBlock: previousState.epochStartBlock ?? blockNumber,
    lastBlockNumber: blockNumber,
    lastBlockUpdatedAt: observedAt,
  };

  return { state, epochAdvanced: false };
}

interface EpochSummary {
  samples: readonly EpochSample[];
  avgEpochDurationMs: number | null;
  avgActiveDurationMs: number | null;
  avgDelayDurationMs: number | null;
  lastEpochDurationMs: number | null;
  lastEpochActiveDurationMs: number | null;
  lastEpochDelayDurationMs: number | null;
}

function summarizePreviousEpoch(
  previousState: Epoch | null,
  observedAt: Date,
  blockNumber: bigint,
): EpochSummary {
  const baselineSamples: EpochSample[] = previousState ? [...previousState.samples] : [];

  if (!previousState) {
    return {
      samples: baselineSamples,
      avgEpochDurationMs: null,
      avgActiveDurationMs: null,
      avgDelayDurationMs: null,
      lastEpochDurationMs: null,
      lastEpochActiveDurationMs: null,
      lastEpochDelayDurationMs: null,
    };
  }

  const startBlock = previousState.epochStartBlock;
  const finalBlock = previousState.lastBlockNumber ?? blockNumber;
  const blockDelta = startBlock !== null ? finalBlock - startBlock : 0n;
  const totalDurationMs = blockDelta > 0n ? Number(blockDelta) * AVERAGE_BLOCK_TIME_MS : null;

  let activeDurationMs: number | null = null;
  let delayDurationMs: number | null = null;

  if (previousState.epochStartedAt) {
    if (previousState.delayStartedAt) {
      activeDurationMs = Math.max(
        previousState.delayStartedAt.getTime() - previousState.epochStartedAt.getTime(),
        0,
      );
      const reference = previousState.lastBlockUpdatedAt ?? observedAt;
      delayDurationMs = Math.max(reference.getTime() - previousState.delayStartedAt.getTime(), 0);
    } else if (totalDurationMs !== null) {
      activeDurationMs = totalDurationMs;
    }
  }

  if (totalDurationMs !== null) {
    const sample: EpochSample = {
      epoch: previousState.epoch,
      totalDurationMs,
      activeDurationMs,
      delayDurationMs,
      completedAt: observedAt,
    };

    baselineSamples.push(sample);
    while (baselineSamples.length > MAX_EPOCH_SAMPLES) {
      baselineSamples.shift();
    }
  }

  const avgEpochDurationMs = computeAverage(baselineSamples.map((sample) => sample.totalDurationMs));
  const avgActiveDurationMs = computeAverage(
    baselineSamples
      .map((sample) => sample.activeDurationMs)
      .filter((value): value is number => value !== null && value !== undefined),
  );
  const avgDelayDurationMs = computeAverage(
    baselineSamples
      .map((sample) => sample.delayDurationMs)
      .filter((value): value is number => value !== null && value !== undefined),
  );

  return {
    samples: baselineSamples,
    avgEpochDurationMs,
    avgActiveDurationMs,
    avgDelayDurationMs,
    lastEpochDurationMs: totalDurationMs,
    lastEpochActiveDurationMs: activeDurationMs,
    lastEpochDelayDurationMs: delayDurationMs,
  };
}

function computeAverage(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
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
