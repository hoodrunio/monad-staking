import type { MiddlewareHandler } from 'hono';
import type Redis from 'ioredis';
import { getRedis } from '../../infrastructure';
import { logger } from '../../infrastructure';
import { TtlCache } from '../../lib/cache';

export type RateLimitOptions = {
  limit: number;
  windowSeconds: number;
  prefix?: string;
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

export function createRateLimitMiddleware({ limit, windowSeconds, prefix = 'rl' }: RateLimitOptions): MiddlewareHandler {
  let redis: Redis | null = null;
  let initialized = false;
  let disabled = false;
  let initPromise: Promise<void> | null = null;
  const memoryBuckets = new TtlCache<MemoryBucket>(windowSeconds * 1_000);

  const ensureRedis = async (): Promise<Redis | null> => {
    if (disabled) return null;
    if (redis) return redis;
    if (!initialized) {
      initialized = true;
      initPromise = (async () => {
        try {
          const client = getRedis();
          await client.ping();
          redis = client;
        } catch (err) {
          disabled = true;
          redis = null;
          logger.warn('rate limiter redis disabled, using memory store', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
    }
    if (initPromise) await initPromise;
    return redis;
  };

  return async (c, next) => {
    if (c.req.method === 'OPTIONS') {
      await next();
      return;
    }
    const client = await ensureRedis();
    const nowSeconds = Math.floor(Date.now() / 1_000);
    const key = deriveClientKey(c);
    const redisKey = `${prefix}:${key}`;
    let count = 0;
    let retryAfter = windowSeconds;

    if (client) {
      try {
        count = await client.incr(redisKey);
        if (count === 1) await client.expire(redisKey, windowSeconds);
        const ttl = await client.ttl(redisKey);
        if (ttl > 0) retryAfter = ttl;
      } catch (err) {
        logger.warn('rate limiter redis error, falling back to memory', {
          error: err instanceof Error ? err.message : String(err),
        });
        disabled = true;
      }
    }

    if (!client || disabled) {
      const bucket = memoryBuckets.get(key);
      if (!bucket || bucket.resetAt <= nowSeconds) {
        count = 1;
        retryAfter = windowSeconds;
        memoryBuckets.set(key, { count, resetAt: nowSeconds + windowSeconds });
      } else {
        count = bucket.count + 1;
        retryAfter = bucket.resetAt - nowSeconds;
        memoryBuckets.set(key, { count, resetAt: bucket.resetAt });
      }
    }

    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(Math.max(limit - count, 0)));
    c.header('X-RateLimit-Reset', String(retryAfter));

    if (count > limit) {
      c.header('Retry-After', String(Math.max(retryAfter, 1)));
      logger.info('rate limit exceeded', { key, limit, count });
      return c.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests, please retry later.' } }, 429);
    }

    await next();
  };
}

function deriveClientKey(c: Parameters<MiddlewareHandler>[0]): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = c.req.header('x-real-ip');
  if (realIp) return realIp;
  const cfConnectingIp = c.req.header('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;
  // Fall back to user-agent to avoid collapsing everything to one bucket in serverless contexts.
  const ua = c.req.header('user-agent') ?? 'unknown';
  return `anon:${ua}`;
}
