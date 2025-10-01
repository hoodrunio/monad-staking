import type { Network } from './types';

export interface Epoch {
  network: Network;
  epoch: bigint;
  inDelayPeriod: boolean;
  updatedAt: Date;
}

export interface EpochRepository {
  get(network: Network): Promise<Epoch | null>;
  save(epoch: Epoch): Promise<void>;
}
