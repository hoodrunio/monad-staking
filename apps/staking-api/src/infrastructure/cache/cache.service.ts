import { createHybridCache, TtlCache } from '../../lib/cache';

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}

export class HybridCacheService implements CacheService {
  private cache: ReturnType<typeof createHybridCache<unknown>>;

  constructor(prefix: string, ttlSeconds: number) {
    this.cache = createHybridCache<unknown>({ prefix, ttlSeconds });
  }

  async get<T>(key: string): Promise<T | null> {
    return (await this.cache.get(key)) as T | null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.cache.set(key, value);
  }
}

export class MemoryCacheService implements CacheService {
  private cache: TtlCache<unknown>;

  constructor(ttlMs: number) {
    this.cache = new TtlCache<unknown>(ttlMs);
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get(key) as T | null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
  }
}
