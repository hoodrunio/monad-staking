
const DEFAULT_CORS = ['http://localhost:3000', 'https://staking.hoodscan.io', 'https://dev.staking.hoodscan.io', 'https://www.staknads.xyz', 'https://staknads.xyz'];
function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBigInt(value: string | undefined, fallback: bigint): bigint {
  if (!value) return fallback;
  try {
    return BigInt(value);
  } catch {
    return fallback;
  }
}

function toStringList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export const serverConfig = {
  port: toNumber(process.env.PORT, 8787),
};

export const corsConfig = {
  defaults: DEFAULT_CORS,
  extra: toStringList(process.env.CORS_ALLOWED_ORIGINS),
};

export const rateLimitConfig = {
  limit: toNumber(process.env.RATE_LIMIT, 180),
  windowSeconds: toNumber(process.env.RATE_LIMIT_WINDOW, 60),
  prefix: 'staking-api',
};

export const ingestConfig = {
  missThreshold: toNumber(process.env.INGEST_MISS_THRESHOLD, 8),
  batchSize: toNumber(process.env.INGEST_BATCH_SIZE, 32),
  resumeLookback: toBigInt(process.env.INGEST_RESUME_LOOKBACK, 256n),
};

export const workerConfig = {
  pollMs: toNumber(process.env.EPOCH_POLL_MS, 30_000),
  pollMinMs: toNumber(process.env.EPOCH_POLL_MIN_MS, 5_000),
  pollMaxMs: toNumber(process.env.EPOCH_POLL_MAX_MS, 300_000),
  ingestMaxRetries: toNumber(process.env.INGEST_MAX_RETRIES, 3),
};

export const githubConfig = {
  token: process.env.GITHUB_TOKEN,
};

export const priceConfig = {
  coinId: process.env.PRICE_COIN_ID ?? 'monad',
  vsCurrency: process.env.PRICE_VS_CURRENCY ?? 'usd',
  cacheTtlSeconds: toNumber(process.env.PRICE_CACHE_TTL_SECONDS, 60),
  includeLastUpdated: process.env.PRICE_INCLUDE_LAST_UPDATED !== 'false',
  apiKey: process.env.COINGECKO_API_KEY,
  apiTier: (process.env.COINGECKO_API_TIER?.toLowerCase() === 'pro' ? 'pro' : 'public') as 'public' | 'pro',
  refreshIntervalMs: toNumber(process.env.PRICE_REFRESH_INTERVAL_MS, 300_000),
};
