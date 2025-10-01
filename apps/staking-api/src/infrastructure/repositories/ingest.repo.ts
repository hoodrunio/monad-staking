import type { Collection } from 'mongodb';
import type { IngestState, IngestRepository } from '../../domain/ingest';
import type { Network } from '../../domain/types';
import type { IngestStateDoc } from '../../infra/db';

export class MongoIngestRepository implements IngestRepository {
  constructor(private collection: Collection<IngestStateDoc>) {}

  async get(network: Network): Promise<IngestState | null> {
    const doc = await this.collection.findOne({ _id: network });
    return doc ? this.toDomain(doc) : null;
  }

  async save(state: IngestState): Promise<void> {
    await this.collection.updateOne(
      { _id: state.network },
      {
        $set: {
          nextValidatorId: state.nextValidatorId.toString(),
          updatedAt: state.updatedAt.toISOString(),
        },
      },
      { upsert: true },
    );
  }

  private toDomain(doc: IngestStateDoc): IngestState {
    return {
      network: doc._id as Network,
      nextValidatorId: BigInt(doc.nextValidatorId),
      updatedAt: new Date(doc.updatedAt),
    };
  }
}
