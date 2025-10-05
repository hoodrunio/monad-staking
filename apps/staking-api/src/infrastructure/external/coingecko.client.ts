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

export class CoingeckoPriceProvider implements PriceProvider {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';

  constructor(private readonly options: { includeLastUpdated: boolean } = { includeLastUpdated: true }) {}

  async getPrice(assetId: string, vsCurrency: string): Promise<PriceQuote> {
    const params = new URLSearchParams({
      ids: assetId,
      vs_currencies: vsCurrency,
    });

    if (this.options.includeLastUpdated) {
      params.set('include_last_updated_at', 'true');
    }

    const response = await fetch(`${this.baseUrl}/simple/price?${params.toString()}`, {
      headers: {
        accept: 'application/json',
      },
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

    const lastUpdatedAt = this.options.includeLastUpdated
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
