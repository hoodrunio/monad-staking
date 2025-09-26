import { randomUUID } from 'node:crypto';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { validatorRoutes } from './http/routes/validators';
import { epochRoutes } from './http/routes/epoch';
import { delegationsRoutes } from './http/routes/delegations';
import { withdrawalsRoutes } from './http/routes/withdrawals';
import { ingestAllValidators } from './services/ingest';
import { getResolvedNetworks } from './infra/clients';
import { logger } from './infra/logger';
import { createRateLimitMiddleware } from './http/middleware/rate-limit';
import { metricsRegistry, recordHttpMetrics } from './infra/metrics';
import { getMongo, getRedis } from './infra/db';
import { corsConfig, rateLimitConfig, serverConfig } from './config/env';

const app = new Hono<{
  Variables: {
    requestId: string;
    routeTag: string;
  };
}>();

const allowlist = new Set([...corsConfig.defaults, ...corsConfig.extra]);

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return origin;
    if (allowlist.has(origin)) return origin;
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) return origin;
    if (origin.match(/^https:\/\/.*\.netlify\.app$/)) return origin;
    return null;
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'OPTIONS'],
}));

app.use('*', async (c, next) => {
  const requestId = randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);
  const start = Date.now();
  try {
    await next();
  } finally {
    const durationMs = Date.now() - start;
    const status = c.res?.status ?? 500;
    const routeTag = canonicalRoute(c.req.path);
    c.set('routeTag', routeTag);
    recordHttpMetrics({
      method: c.req.method,
      route: routeTag,
      status,
      durationMs,
    });
    logger.info('http_request', {
      requestId,
      method: c.req.method,
      path: c.req.path,
      route: routeTag,
      status,
      durationMs,
      userAgent: c.req.header('user-agent'),
      ip: resolveClientIp(c),
    });
  }
});

const rateLimit = createRateLimitMiddleware(rateLimitConfig);

app.use('/api/*', rateLimit);

app.onError((err, c) => {
  const message = err instanceof Error ? err.message : 'Unexpected error';
  const requestId = c.get('requestId');
  const routeTag = c.get('routeTag');
  logger.error('Unhandled error', {
    message,
    requestId,
    route: routeTag ?? canonicalRoute(c.req.path),
  });
  return c.json({ error: { code: 'INTERNAL_ERROR', message, requestId } }, 500);
});

app.get('/health', async (c) => {
  const checks: Record<string, { ok: boolean; error?: string }> = {};
  try {
    const db = await getMongo();
    await db.command({ ping: 1 });
    checks.mongo = { ok: true };
  } catch (err) {
    checks.mongo = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  try {
    const redis = getRedis();
    await redis.ping();
    checks.redis = { ok: true };
  } catch (err) {
    checks.redis = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  return c.json({
    ok: Object.values(checks).every((c) => c.ok),
    uptimeSeconds: Math.floor(process.uptime()),
    checks,
  });
});

app.get('/metrics', async (c) => {
  c.header('Content-Type', metricsRegistry.contentType);
  return c.body(await metricsRegistry.metrics());
});

app.route('/api/epoch', epochRoutes);
app.route('/api/validators', validatorRoutes);
app.route('/api/delegations', delegationsRoutes);
app.route('/api/withdrawals', withdrawalsRoutes);

const port = serverConfig.port;
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
      ingestAllValidators(key).catch((e) =>
        logger.warn('bootstrap ingest failed', {
          network: key,
          error: String(e),
        }),
      );
    }
  } catch (e) {
    logger.warn('bootstrap skipped', { error: String(e) });
  }
})();

function canonicalRoute(path: string): string {
  if (path.startsWith('/api/validators/')) return '/api/validators/:id';
  if (path.startsWith('/api/delegations')) return '/api/delegations';
  if (path.startsWith('/api/withdrawals')) return '/api/withdrawals';
  if (path.startsWith('/api/epoch')) return '/api/epoch';
  return path;
}

function resolveClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = c.req.header('x-real-ip') ?? c.req.header('cf-connecting-ip');
  if (realIp) return realIp;
  return 'unknown';
}
