import { getResolvedNetworks, getSdk } from './clients';
import { epochCol } from './db';
import { logger } from './logger';
import { ingestAllValidators } from './ingest';

const BASE_DELAY_MS = Number(process.env.EPOCH_POLL_MS ?? 30_000);
const MAX_DELAY_MS = Number(process.env.EPOCH_POLL_MAX_MS ?? 300_000);
const MIN_DELAY_MS = Number(process.env.EPOCH_POLL_MIN_MS ?? 5_000);
const INGEST_MAX_RETRIES = Number(process.env.INGEST_MAX_RETRIES ?? 3);

async function pollNetwork(network: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2') {
  const resolvedMap = getResolvedNetworks();
  const resolved = resolvedMap[network];
  if (!resolved) {
    logger.warn('worker.skip.network', { network });
    return;
  }

  const sdk = getSdk(resolved);
  const epochs = await epochCol();

  let lastEpoch: string | null = null;
  let backoffMs = BASE_DELAY_MS;
  let delayStateLogged = false;

  logger.info('worker.poll.start', { network, pollMs: BASE_DELAY_MS });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const cycleStart = Date.now();
    try {
      const epochInfo = await sdk.getEpoch();
      const epochStr = epochInfo.epoch.toString();

      await epochs.updateOne(
        { _id: network },
        {
          $set: {
            epoch: epochStr,
            inEpochDelayPeriod: epochInfo.inEpochDelayPeriod,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );

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

async function runIngestWithRetry(network: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2', epoch: string) {
  for (let attempt = 0; attempt <= INGEST_MAX_RETRIES; attempt++) {
    try {
      await ingestAllValidators(network);
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
  const resolved = getResolvedNetworks();
  const networks = Object.keys(resolved) as Array<'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2'>;
  if (networks.length === 0) {
    logger.warn('worker.no_networks');
    return;
  }
  await Promise.all(networks.map((network) => pollNetwork(network)));
}

main().catch((error) => {
  logger.error('worker.fatal', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

