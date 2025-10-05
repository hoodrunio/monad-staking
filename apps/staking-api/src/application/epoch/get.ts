import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import type { BlockchainClient } from '../../infrastructure/blockchain/sdk.client';
import type { CacheService } from '../../infrastructure/cache/cache.service';
import type { Network } from '../../domain/types';
import type { Epoch, EpochRepository } from '../../domain/epoch';

const AVERAGE_BLOCK_TIME_MS = 500;

export interface GetEpochInput {
  network: Network;
  networkConfig: ResolvedMonadNetworkConfig;
}

export interface EpochProgressOutput {
  phase: 'active' | 'delay';
  percent: number | null;
  phasePercent: number | null;
  estimatedEpochDurationMs: number | null;
  estimatedPhaseDurationMs: number | null;
  elapsedMs: number | null;
  phaseElapsedMs: number | null;
  estimatedTimeToNextEpochMs: number | null;
  estimatedPhaseTimeRemainingMs: number | null;
  epochStartedAt: string | null;
  delayStartedAt: string | null;
  lastEpochDurationMs: number | null;
  lastEpochActiveDurationMs: number | null;
  lastEpochDelayDurationMs: number | null;
  samples: Array<{
    epoch: string;
    totalDurationMs: number;
    activeDurationMs: number | null;
    delayDurationMs: number | null;
    completedAt: string;
  }>;
  observedAt: string | null;
  calculatedAt: string;
  source: 'derived' | 'stale' | 'unavailable';
}

export interface GetEpochOutput {
  epoch: string;
  inEpochDelayPeriod: boolean;
  epochLength: number;
  epochDelayPeriod: number;
  withdrawalDelay: number;
  progress: EpochProgressOutput;
}

export class GetEpochUseCase {
  constructor(
    private blockchainClient: BlockchainClient,
    private cache: CacheService,
    private epochRepo: EpochRepository,
  ) {}

  async execute(input: GetEpochInput): Promise<GetEpochOutput> {
    const cacheKey = `epoch:${input.network}`;
    const now = new Date();
    const cached = await this.cache.get<GetEpochOutput>(cacheKey);

    if (cached) {
      const state = await this.epochRepo.get(input.network);
      const progress = this.buildProgress(
        {
          epoch: BigInt(cached.epoch),
          inEpochDelayPeriod: cached.inEpochDelayPeriod,
        },
        state,
        now,
        cached.epochLength,
        cached.epochDelayPeriod,
      );

      return { ...cached, progress };
    }

    const [info, state] = await Promise.all([
      this.blockchainClient.getEpoch(),
      this.epochRepo.get(input.network),
    ]);

    const output: GetEpochOutput = {
      epoch: info.epoch.toString(),
      inEpochDelayPeriod: info.inEpochDelayPeriod,
      epochLength: input.networkConfig.epochLength,
      epochDelayPeriod: input.networkConfig.epochDelayPeriod,
      withdrawalDelay: input.networkConfig.withdrawalDelay,
      progress: this.buildProgress(
        info,
        state,
        now,
        input.networkConfig.epochLength,
        input.networkConfig.epochDelayPeriod,
      ),
    };

    await this.cache.set(cacheKey, output);
    return output;
  }

  private buildProgress(
    info: { epoch: bigint; inEpochDelayPeriod: boolean },
    state: Epoch | null,
    now: Date,
    epochLength: number,
    epochDelayPeriod: number,
  ): EpochProgressOutput {
    const phase: EpochProgressOutput['phase'] = info.inEpochDelayPeriod ? 'delay' : 'active';

    if (!state) {
      return this.emptyProgress(phase, now, 'unavailable');
    }

    if (state.epoch !== info.epoch) {
      return this.emptyProgress(phase, now, 'stale', state);
    }

    const epochStartBlock = state.epochStartBlock;
    const lastBlockNumber = state.lastBlockNumber;
    let blockDelta: number | null = null;

    if (epochStartBlock !== null && lastBlockNumber !== null) {
      const diff = lastBlockNumber - epochStartBlock;
      if (diff >= 0n) {
        blockDelta = Number(diff);
      }
    }

    const estimatedEpochDurationMs = epochLength * AVERAGE_BLOCK_TIME_MS;
    const elapsedMs = blockDelta !== null ? blockDelta * AVERAGE_BLOCK_TIME_MS : null;
    const percent = this.computeRatio(elapsedMs, estimatedEpochDurationMs);

    const delayStartedAt = state.delayStartedAt;
    const delayElapsedMs = delayStartedAt
      ? Math.max(now.getTime() - delayStartedAt.getTime(), 0)
      : null;

    const estimatedDelayDurationMs = epochDelayPeriod * AVERAGE_BLOCK_TIME_MS;

    const phaseElapsedMs = phase === 'delay' ? delayElapsedMs : elapsedMs;
    const estimatedPhaseDurationMs = phase === 'delay' ? estimatedDelayDurationMs : estimatedEpochDurationMs;
    const phasePercent = phase === 'delay'
      ? this.computeRatio(phaseElapsedMs, estimatedPhaseDurationMs)
      : percent;

    const estimatedPhaseTimeRemainingMs = this.computeRemaining(phaseElapsedMs, estimatedPhaseDurationMs);
    const estimatedTimeToNextEpochMs = phase === 'delay'
      ? estimatedPhaseTimeRemainingMs
      : this.computeRemaining(elapsedMs, estimatedEpochDurationMs);

    const source: EpochProgressOutput['source'] = blockDelta !== null ? 'derived' : 'unavailable';

    return {
      phase,
      percent,
      phasePercent,
      estimatedEpochDurationMs,
      estimatedPhaseDurationMs,
      elapsedMs,
      phaseElapsedMs,
      estimatedTimeToNextEpochMs,
      estimatedPhaseTimeRemainingMs,
      epochStartedAt: state.epochStartedAt ? state.epochStartedAt.toISOString() : null,
      delayStartedAt: delayStartedAt ? delayStartedAt.toISOString() : null,
      lastEpochDurationMs: state.lastEpochDurationMs,
      lastEpochActiveDurationMs: state.lastEpochActiveDurationMs,
      lastEpochDelayDurationMs: state.lastEpochDelayDurationMs,
      samples: state.samples.map((sample) => ({
        epoch: sample.epoch.toString(),
        totalDurationMs: sample.totalDurationMs,
        activeDurationMs: sample.activeDurationMs,
        delayDurationMs: sample.delayDurationMs,
        completedAt: sample.completedAt.toISOString(),
      })),
      observedAt: (state.lastBlockUpdatedAt ?? state.updatedAt).toISOString(),
      calculatedAt: now.toISOString(),
      source,
    };
  }

  private emptyProgress(
    phase: EpochProgressOutput['phase'],
    now: Date,
    source: EpochProgressOutput['source'],
    state?: Epoch | null,
  ): EpochProgressOutput {
    return {
      phase,
      percent: null,
      phasePercent: null,
      estimatedEpochDurationMs: null,
      estimatedPhaseDurationMs: null,
      elapsedMs: null,
      phaseElapsedMs: null,
      estimatedTimeToNextEpochMs: null,
      estimatedPhaseTimeRemainingMs: null,
      epochStartedAt: state?.epochStartedAt ? state.epochStartedAt.toISOString() : null,
      delayStartedAt: state?.delayStartedAt ? state.delayStartedAt.toISOString() : null,
      lastEpochDurationMs: state?.lastEpochDurationMs ?? null,
      lastEpochActiveDurationMs: state?.lastEpochActiveDurationMs ?? null,
      lastEpochDelayDurationMs: state?.lastEpochDelayDurationMs ?? null,
      samples: state?.samples.map((sample) => ({
        epoch: sample.epoch.toString(),
        totalDurationMs: sample.totalDurationMs,
        activeDurationMs: sample.activeDurationMs,
        delayDurationMs: sample.delayDurationMs,
        completedAt: sample.completedAt.toISOString(),
      })) ?? [],
      observedAt: (state?.lastBlockUpdatedAt ?? state?.updatedAt)?.toISOString() ?? null,
      calculatedAt: now.toISOString(),
      source,
    };
  }

  private computeRatio(elapsed: number | null, total: number | null): number | null {
    if (elapsed === null || total === null || total <= 0) return null;
    return Math.min(Math.max(elapsed / total, 0), 1);
  }

  private computeRemaining(elapsed: number | null, total: number | null): number | null {
    if (elapsed === null || total === null || total <= 0) return null;
    return Math.max(total - elapsed, 0);
  }
}
