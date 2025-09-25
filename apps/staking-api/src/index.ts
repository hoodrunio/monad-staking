import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { validatorRoutes } from './routes/validators';
import { epochRoutes } from './routes/epoch';
import { delegationsRoutes } from './routes/delegations';
import { withdrawalsRoutes } from './routes/withdrawals';
import { ingestAllValidators } from './ingest';
import { getResolvedNetworks } from './clients';
import { logger } from './logger';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://staking.hoodscan.io',
    ];
    if (!origin) return origin; // Allow requests with no origin (e.g., mobile apps)
    if (allowed.includes(origin)) return origin;
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) return origin;
    if (origin.match(/^https:\/\/.*\.netlify\.app$/)) return origin;
    return null; // Block other origins
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.onError((err, c) => {
  const message = err instanceof Error ? err.message : 'Unexpected error';
  logger.error('Unhandled error', { message });
  return c.json({ error: { code: 'INTERNAL_ERROR', message } }, 500);
});

app.get('/health', (c) => c.json({ ok: true }));

app.route('/api/epoch', epochRoutes);
app.route('/api/validators', validatorRoutes);
app.route('/api/delegations', delegationsRoutes);
app.route('/api/withdrawals', withdrawalsRoutes);

const port = Number(process.env.PORT ?? 8787);
logger.info('staking-api starting', { port });

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
      ingestAllValidators(key).catch((e) => logger.warn('bootstrap ingest failed', { network: key, error: String(e) }));
    }
  } catch (e) {
    logger.warn('bootstrap skipped', { error: String(e) });
  }
})();


