import type { Network } from './types';

export interface EpochSample {
  epoch: bigint;
  totalDurationMs: number;
  activeDurationMs: number | null;
  delayDurationMs: number | null;
  completedAt: Date;
}

export interface Epoch {
  network: Network;
  epoch: bigint;
  inDelayPeriod: boolean;
  updatedAt: Date;
  epochStartedAt: Date | null;
  delayStartedAt: Date | null;
  epochStartBlock: bigint | null;
  lastBlockNumber: bigint | null;
  lastBlockUpdatedAt: Date | null;
  lastEpochDurationMs: number | null;
  lastEpochActiveDurationMs: number | null;
  lastEpochDelayDurationMs: number | null;
  avgEpochDurationMs: number | null;
  avgActiveDurationMs: number | null;
  avgDelayDurationMs: number | null;
  samples: readonly EpochSample[];
}

export interface EpochRepository {
  get(network: Network): Promise<Epoch | null>;
  save(epoch: Epoch): Promise<void>;
}
