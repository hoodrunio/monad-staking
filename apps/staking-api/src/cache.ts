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


