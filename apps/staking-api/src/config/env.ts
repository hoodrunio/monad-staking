const DEFAULT_CORS = ['http://localhost:3000', 'https://staking.hoodscan.io'];

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

