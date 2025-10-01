export type Network = 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2';

export interface Amount {
  raw: bigint;
  decimal: string;
  formatted: string;
}

export interface Commission {
  raw: bigint;
  decimal: string;
  percentage: string;
}

export interface Keys {
  secpPubkey?: string;
  blsPubkey?: string;
}

export interface ValidatorMetadata {
  name?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  contacts?: Record<string, string>;
  githubPath?: string;
  githubSha?: string;
}
