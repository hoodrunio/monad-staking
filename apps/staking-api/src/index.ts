import { Hono } from 'hono';
import { validatorRoutes } from './routes/validators';
import { epochRoutes } from './routes/epoch';
import { delegationsRoutes } from './routes/delegations';
import { withdrawalsRoutes } from './routes/withdrawals';
import { ingestAllValidators } from './ingest';
import { getResolvedNetworks } from './clients';

const app = new Hono();

app.onError((err, c) => {
  const message = err instanceof Error ? err.message : 'Unexpected error';
  const status = 500;
  return c.json({ error: { code: 'INTERNAL_ERROR', message } }, status);
});

app.get('/health', (c) => c.json({ ok: true }));

app.route('/api/epoch', epochRoutes);
app.route('/api/validators', validatorRoutes);
app.route('/api/delegations', delegationsRoutes);
app.route('/api/withdrawals', withdrawalsRoutes);

const port = Number(process.env.PORT ?? 8787);
console.log(`[staking-api] starting on :${port}`);

export default {
  port,
  fetch: app.fetch,
};

// Bootstrap one-time ingestion on startup (fire-and-forget)
(async () => {
  try {
    const networks = getResolvedNetworks();
    for (const key of Object.keys(networks) as Array<'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2'>) {
      // Run without blocking server start
      ingestAllValidators(key).catch((e) => console.warn(`[bootstrap] ingest failed for ${key}`, e));
    }
  } catch (e) {
    console.warn('[bootstrap] skipped', e);
  }
})();


