import type Redis from 'ioredis';
import { getRedis } from './db';
import { logger } from './logger';

export interface CacheEntry<T> {
  readonly value: T;
  readonly expireAt: number;
}

export class TtlCache<TValue> {
  private readonly store = new Map<string, CacheEntry<TValue>>();

  constructor(private readonly defaultTtlMs: number) {}

  get(key: string): TValue | null {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expireAt <= now) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: TValue, ttlMs?: number): void {
    const expireAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expireAt });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export interface CacheStore<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

type HybridCacheOptions = {
  prefix: string;
  ttlSeconds: number;
  fallbackTtlMs?: number;
};

// Provides Redis-backed caching with an in-memory fallback for local/dev usage.
export function createHybridCache<TValue>({
  prefix,
  ttlSeconds,
  fallbackTtlMs,
}: HybridCacheOptions): CacheStore<TValue> {
  const fallback = new TtlCache<TValue>(fallbackTtlMs ?? ttlSeconds * 1_000);
  let redis: Redis | null = null;
  let initialized = false;
  let initPromise: Promise<void> | null = null;
  let disabled = false;

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
          logger.warn('redis cache disabled, falling back to memory', {
            prefix,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
    }
    if (initPromise) await initPromise;
    return redis;
  };

  const keyFor = (key: string) => `${prefix}:${key}`;

  return {
    async get(key: string): Promise<TValue | null> {
      const client = await ensureRedis();
      if (client) {
        try {
          const raw = await client.get(keyFor(key));
          if (!raw) return null;
          return JSON.parse(raw) as TValue;
        } catch (err) {
          logger.warn('redis cache get failed', {
            key: keyFor(key),
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      return fallback.get(key);
    },

    async set(key: string, value: TValue, ttl?: number): Promise<void> {
      const ttlToUse = ttl ?? ttlSeconds;
      const client = await ensureRedis();
      if (client) {
        try {
          await client.set(keyFor(key), JSON.stringify(value), 'EX', ttlToUse);
        } catch (err) {
          logger.warn('redis cache set failed', {
            key: keyFor(key),
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      fallback.set(key, value, ttlToUse * 1_000);
    },

    async delete(key: string): Promise<void> {
      const client = await ensureRedis();
      if (client) {
        try {
          await client.del(keyFor(key));
        } catch (err) {
          logger.warn('redis cache delete failed', {
            key: keyFor(key),
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      fallback.delete(key);
    },
  };
}

