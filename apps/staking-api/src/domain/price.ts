export interface PriceQuote {
  assetId: string;
  currency: string;
  amount: number;
  fetchedAt: Date;
  lastUpdatedAt: Date | null;
}

export interface PriceProvider {
  getPrice(assetId: string, vsCurrency: string): Promise<PriceQuote>;
}
