import type { Network } from './types';

export interface IngestState {
  network: Network;
  nextValidatorId: bigint;
  updatedAt: Date;
}

export interface IngestRepository {
  get(network: Network): Promise<IngestState | null>;
  save(state: IngestState): Promise<void>;
}
