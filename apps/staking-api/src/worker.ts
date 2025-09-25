import { getResolvedNetworks, getSdk } from './clients';
import { epochCol, validatorsCol } from './db';
import { logger } from './logger';
import { ingestAllValidators } from './ingest';

const POLL_MS = Number(process.env.EPOCH_POLL_MS ?? 30_000);

async function pollNetwork(network: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2') {
  const resolvedMap = getResolvedNetworks();
  const resolved = resolvedMap[network];
  if (!resolved) return;
  const sdk = getSdk(resolved);
  const col = await epochCol();
  let lastEpoch: string | null = null;

  // initialize
  try {
    const state = await col.findOne({ _id: network });
    if (state) lastEpoch = state.epoch;
  } catch (err) {
    console.warn(`[worker] failed to read epoch state for ${network}`, err);
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const info = await sdk.getEpoch();
      const epochStr = info.epoch.toString();
      await col.updateOne(
        { _id: network },
        { $set: { epoch: epochStr, inEpochDelayPeriod: info.inEpochDelayPeriod, updatedAt: new Date().toISOString() } },
        { upsert: true },
      );

      if (lastEpoch !== epochStr && !info.inEpochDelayPeriod) {
        // trigger ingestion when entering new epoch (outside delay period)
        lastEpoch = epochStr;
        logger.info('epoch transition', { network, epoch: epochStr });
        await ingestAllValidators(network);

        // Update isActive flags for consensus set snapshot of this epoch
        try {
          let cursor = 0;
          const active = new Set<string>();
          for (let i = 0; i < 1000; i++) {
            const page = await sdk.getConsensusValidatorSet(cursor);
            for (const id of page.validatorIds) active.add(id.toString());
            if (page.isDone) break;
            cursor = page.nextIndex;
          }
          const col = await validatorsCol();
          // Reset all to false for network, then set true for active
          await col.updateMany({ network }, { $set: { isActive: false } });
          if (active.size > 0) {
            await col.updateMany({ network, validatorId: { $in: Array.from(active) } }, { $set: { isActive: true, activeEpoch: epochStr } });
          }
          logger.info('consensus set updated', { network, epoch: epochStr, activeCount: active.size });
        } catch (e) {
          logger.warn('consensus set update failed', { network, epoch: epochStr, error: String(e) });
        }
      }
    } catch (err) {
      logger.error('worker poll error', { network, error: String(err) });
    }

    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

async function main() {
  const networks: ('monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2')[] = [
    'monad-mainnet',
    'monad-testnet-1',
    'monad-testnet-2',
  ];
  await Promise.all(networks.map((n) => pollNetwork(n)));
}

main().catch((e) => {
  console.error('[worker] fatal', e);
  process.exit(1);
});


