import { getResolvedNetworks, getSdk } from './clients';
import { epochCol } from './db';
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
  } catch {}

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
        await ingestAllValidators(network);
      }
    } catch (err) {
      console.error(`[worker] poll error ${network}`, err);
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


