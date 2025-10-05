import { z } from 'zod';
import type { PriceProvider, PriceQuote } from '../../domain/price';

const simplePriceSchema = z.record(
  z.string(),
  z
    .object({
      last_updated_at: z.number().optional(),
    })
    .catchall(z.number()),
);

type SimplePriceResponse = z.infer<typeof simplePriceSchema>;

interface CoingeckoOptions {
  includeLastUpdated?: boolean;
  baseUrl?: string;
  apiKey?: string | null;
  tier?: 'public' | 'pro';
}

export class CoingeckoPriceProvider implements PriceProvider {
  private readonly baseUrl: string;
  private readonly includeLastUpdated: boolean;
  private readonly apiKey: string | null;
  private readonly tier: 'public' | 'pro';

  constructor(options: CoingeckoOptions = {}) {
    this.includeLastUpdated = options.includeLastUpdated !== false;
    this.baseUrl = options.baseUrl ?? 'https://api.coingecko.com/api/v3';
    this.apiKey = options.apiKey ?? null;
    this.tier = options.tier ?? 'public';
  }

  async getPrice(assetId: string, vsCurrency: string): Promise<PriceQuote> {
    const params = new URLSearchParams({
      ids: assetId,
      vs_currencies: vsCurrency,
    });

    if (this.includeLastUpdated) {
      params.set('include_last_updated_at', 'true');
    }

    const headers: Record<string, string> = {
      accept: 'application/json',
    };

    if (this.apiKey) {
      const headerName = this.tier === 'pro' ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key';
      headers[headerName] = this.apiKey;
    }

    const response = await fetch(`${this.baseUrl}/simple/price?${params.toString()}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Coingecko request failed: ${response.status}`);
    }

    const json = (await response.json()) as unknown;
    const parsed: SimplePriceResponse = simplePriceSchema.parse(json);
    const assetEntry = parsed[assetId];
    if (!assetEntry) {
      throw new Error(`Price for asset ${assetId} not found`);
    }

    const rawValue = assetEntry[vsCurrency];
    if (typeof rawValue !== 'number') {
      throw new Error(`Price for ${assetId}/${vsCurrency} missing in response`);
    }

    const lastUpdatedAt = this.includeLastUpdated
      ? typeof assetEntry.last_updated_at === 'number'
        ? new Date(assetEntry.last_updated_at * 1000)
        : null
      : null;

    return {
      assetId,
      currency: vsCurrency,
      amount: rawValue,
      fetchedAt: new Date(),
      lastUpdatedAt,
    };
  }
}
