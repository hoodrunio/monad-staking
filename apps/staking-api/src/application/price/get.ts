import type { PriceProvider } from '../../domain/price';
import type { CacheService } from '../../infrastructure/cache/cache.service';

export interface GetPriceInput {
  assetId?: string;
  vsCurrency?: string;
  forceRefresh?: boolean;
}

export interface GetPriceOutput {
  assetId: string;
  currency: string;
  price: number;
  fetchedAt: string;
  lastUpdatedAt: string | null;
  source: 'live' | 'cache';
}

export class GetPriceUseCase {
  constructor(
    private readonly provider: PriceProvider,
    private readonly cache: CacheService,
    private readonly defaults: { assetId: string; currency: string },
  ) {}

  async execute(input: GetPriceInput = {}): Promise<GetPriceOutput> {
    const assetId = (input.assetId ?? this.defaults.assetId).toLowerCase();
    const currency = (input.vsCurrency ?? this.defaults.currency).toLowerCase();
    const cacheKey = this.cacheKey(assetId, currency);

    if (!input.forceRefresh) {
      const cached = await this.cache.get<GetPriceOutput>(cacheKey);
      if (cached) {
        return { ...cached, source: 'cache' };
      }
    }

    const quote = await this.provider.getPrice(assetId, currency);
    const output: GetPriceOutput = {
      assetId: quote.assetId,
      currency: quote.currency,
      price: quote.amount,
      fetchedAt: quote.fetchedAt.toISOString(),
      lastUpdatedAt: quote.lastUpdatedAt ? quote.lastUpdatedAt.toISOString() : null,
      source: 'live',
    };

    await this.cache.set(cacheKey, output);
    return output;
  }

  private cacheKey(assetId: string, currency: string): string {
    return `price:${assetId}:${currency}`;
  }
}
