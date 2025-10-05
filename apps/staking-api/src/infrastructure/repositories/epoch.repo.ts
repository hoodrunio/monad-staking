import type { Collection } from 'mongodb';
import type { Epoch, EpochRepository, EpochSample } from '../../domain/epoch';
import type { Network } from '../../domain/types';
import type { EpochProgressSampleDoc, EpochStateDoc } from '../../infrastructure';

export class MongoEpochRepository implements EpochRepository {
  constructor(private collection: Collection<EpochStateDoc>) {}

  async get(network: Network): Promise<Epoch | null> {
    const doc = await this.collection.findOne({ _id: network });
    return doc ? this.toDomain(doc) : null;
  }

  async save(epoch: Epoch): Promise<void> {
    await this.collection.updateOne(
      { _id: epoch.network },
      {
        $set: {
          epoch: epoch.epoch.toString(),
          inEpochDelayPeriod: epoch.inDelayPeriod,
          updatedAt: epoch.updatedAt.toISOString(),
          epochStartedAt: epoch.epochStartedAt?.toISOString() ?? null,
          delayStartedAt: epoch.delayStartedAt?.toISOString() ?? null,
          epochStartBlock: epoch.epochStartBlock?.toString() ?? null,
          lastBlockNumber: epoch.lastBlockNumber?.toString() ?? null,
          lastBlockUpdatedAt: epoch.lastBlockUpdatedAt?.toISOString() ?? null,
          lastEpochDurationMs: epoch.lastEpochDurationMs ?? null,
          lastEpochActiveDurationMs: epoch.lastEpochActiveDurationMs ?? null,
          lastEpochDelayDurationMs: epoch.lastEpochDelayDurationMs ?? null,
          avgEpochDurationMs: epoch.avgEpochDurationMs ?? null,
          avgActiveDurationMs: epoch.avgActiveDurationMs ?? null,
          avgDelayDurationMs: epoch.avgDelayDurationMs ?? null,
          samples: epoch.samples.map((sample) => this.toDocSample(sample)),
        },
      },
      { upsert: true },
    );
  }

  private toDomain(doc: EpochStateDoc): Epoch {
    return {
      network: doc._id as Network,
      epoch: BigInt(doc.epoch),
      inDelayPeriod: doc.inEpochDelayPeriod,
      updatedAt: new Date(doc.updatedAt),
      epochStartedAt: doc.epochStartedAt ? new Date(doc.epochStartedAt) : null,
      delayStartedAt: doc.delayStartedAt ? new Date(doc.delayStartedAt) : null,
      epochStartBlock: doc.epochStartBlock ? BigInt(doc.epochStartBlock) : null,
      lastBlockNumber: doc.lastBlockNumber ? BigInt(doc.lastBlockNumber) : null,
      lastBlockUpdatedAt: doc.lastBlockUpdatedAt ? new Date(doc.lastBlockUpdatedAt) : null,
      lastEpochDurationMs: doc.lastEpochDurationMs ?? null,
      lastEpochActiveDurationMs: doc.lastEpochActiveDurationMs ?? null,
      lastEpochDelayDurationMs: doc.lastEpochDelayDurationMs ?? null,
      avgEpochDurationMs: doc.avgEpochDurationMs ?? null,
      avgActiveDurationMs: doc.avgActiveDurationMs ?? null,
      avgDelayDurationMs: doc.avgDelayDurationMs ?? null,
      samples: (doc.samples ?? []).map((sample) => this.toDomainSample(sample)),
    };
  }

  private toDocSample(sample: EpochSample): EpochProgressSampleDoc {
    return {
      epoch: sample.epoch.toString(),
      totalDurationMs: sample.totalDurationMs,
      activeDurationMs: sample.activeDurationMs ?? null,
      delayDurationMs: sample.delayDurationMs ?? null,
      completedAt: sample.completedAt.toISOString(),
    };
  }

  private toDomainSample(sample: EpochProgressSampleDoc): EpochSample {
    return {
      epoch: BigInt(sample.epoch),
      totalDurationMs: sample.totalDurationMs,
      activeDurationMs: sample.activeDurationMs ?? null,
      delayDurationMs: sample.delayDurationMs ?? null,
      completedAt: new Date(sample.completedAt),
    };
  }
}
