import type { Collection } from 'mongodb';
import type { Epoch, EpochRepository } from '../../domain/epoch';
import type { Network } from '../../domain/types';
import type { EpochStateDoc } from '../../infrastructure';

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
    };
  }
}
