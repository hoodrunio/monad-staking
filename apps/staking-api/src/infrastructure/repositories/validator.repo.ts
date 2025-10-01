import type { Collection } from 'mongodb';
import type { Validator, ValidatorRepository } from '../../domain/validator';
import type { Network, Keys, ValidatorMetadata } from '../../domain/types';
import type { ValidatorDoc } from '../../infra/db';
import { normalizeSecpKey } from '../../lib/key-format';

export class MongoValidatorRepository implements ValidatorRepository {
  constructor(private collection: Collection<ValidatorDoc>) {}

  async findById(network: Network, id: bigint): Promise<Validator | null> {
    const doc = await this.collection.findOne({ _id: `${network}:${id.toString()}` });
    return doc ? this.toDomain(doc) : null;
  }

  async findBySecp(network: Network, secp: string): Promise<Validator | null> {
    const normalized = normalizeSecpKey(secp);
    if (!normalized) return null;
    const doc = await this.collection.findOne({ network, 'keys.secpPubkey': normalized });
    return doc ? this.toDomain(doc) : null;
  }

  async findByAuth(network: Network, authAddress: string): Promise<Validator | null> {
    const doc = await this.collection.findOne({
      network,
      authAddress: { $regex: new RegExp(`^${authAddress}$`, 'i') },
    });
    return doc ? this.toDomain(doc) : null;
  }

  async list(params: {
    network: Network;
    cursor?: string;
    limit: number;
    activeOnly?: boolean;
  }): Promise<{ items: Validator[]; nextCursor: string | null }> {
    const filter = params.activeOnly
      ? { network: params.network, isActive: true }
      : { network: params.network };

    const query = params.cursor
      ? { ...filter, validatorId: { $gt: params.cursor } }
      : filter;

    const docs = await this.collection
      .find(query, { sort: { 'stake.consensus': -1, validatorId: 1 }, limit: params.limit })
      .toArray();

    const items = docs.map((doc) => this.toDomain(doc));
    const nextCursor = docs.length === params.limit ? docs[docs.length - 1]!.validatorId : null;

    return { items, nextCursor };
  }

  async save(validator: Validator): Promise<void> {
    const doc = this.toDocument(validator);
    await this.collection.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
  }

  async saveMany(validators: Validator[]): Promise<void> {
    if (validators.length === 0) return;
    const operations = validators.map((validator) => {
      const doc = this.toDocument(validator);
      return {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true,
        },
      };
    });
    await this.collection.bulkWrite(operations);
  }

  async updateConsensusStatus(network: Network, activeIds: bigint[]): Promise<void> {
    const activeIdsStr = activeIds.map((id) => id.toString());

    await this.collection.updateMany(
      { network, validatorId: { $nin: activeIdsStr } },
      { $set: { isActive: false } },
    );

    if (activeIds.length > 0) {
      await this.collection.updateMany(
        { network, validatorId: { $in: activeIdsStr } },
        { $set: { isActive: true } },
      );
    }
  }

  async updateMetadata(network: Network, secp: string, metadata: ValidatorMetadata): Promise<number> {
    const normalized = normalizeSecpKey(secp);
    if (!normalized) return 0;

    const filterValues = [normalized, normalized.toUpperCase(), `0x${normalized}`, `0X${normalized}`];
    const result = await this.collection.updateMany(
      {
        network,
        $or: filterValues.map((value) => ({ 'keys.secpPubkey': value })),
      },
      {
        $set: {
          meta: metadata,
          'keys.secpPubkey': normalized,
        },
      },
    );

    return result.modifiedCount;
  }

  async normalizeSecpKeys(network: Network): Promise<number> {
    const cursor = this.collection.find(
      { network, 'keys.secpPubkey': { $exists: true } },
      { projection: { _id: 1, 'keys.secpPubkey': 1 } },
    );

    const updates: Array<Promise<unknown>> = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc || !doc.keys?.secpPubkey) continue;

      const secpValue = doc.keys.secpPubkey;
      const normalized = normalizeSecpKey(secpValue);
      
      if (!normalized || normalized === secpValue) continue;

      updates.push(
        this.collection.updateOne(
          { _id: doc._id },
          { $set: { 'keys.secpPubkey': normalized } },
        ),
      );
      count++;

      // Process in batches of 100
      if (updates.length >= 100) {
        await Promise.all(updates);
        updates.length = 0;
      }
    }

    // Process remaining updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return count;
  }

  private toDomain(doc: ValidatorDoc): Validator {
    return {
      id: BigInt(doc.validatorId),
      network: doc.network,
      authAddress: doc.authAddress,
      commission: BigInt(doc.commission),
      stake: {
        execution: BigInt(doc.stake.execution),
        consensus: BigInt(doc.stake.consensus),
        snapshot: BigInt(doc.stake.snapshot),
      },
      unclaimedRewards: BigInt(doc.unclaimedRewards),
      flags: BigInt(doc.flagsRaw),
      keys: doc.keys,
      isActive: doc.isActive,
      activeEpoch: doc.activeEpoch ? BigInt(doc.activeEpoch) : undefined,
      metadata: doc.meta,
      updatedAt: new Date(doc.updatedAt),
    };
  }

  private toDocument(validator: Validator): ValidatorDoc {
    const keys: Keys | undefined = validator.keys ? { ...validator.keys } : undefined;

    return {
      _id: `${validator.network}:${validator.id.toString()}`,
      network: validator.network,
      validatorId: validator.id.toString(),
      authAddress: validator.authAddress,
      commission: validator.commission.toString(),
      stake: {
        execution: validator.stake.execution.toString(),
        consensus: validator.stake.consensus.toString(),
        snapshot: validator.stake.snapshot.toString(),
      },
      unclaimedRewards: validator.unclaimedRewards.toString(),
      flagsRaw: validator.flags.toString(),
      keys,
      isActive: validator.isActive,
      activeEpoch: validator.activeEpoch?.toString(),
      meta: validator.metadata,
      updatedAt: validator.updatedAt.toISOString(),
    };
  }
}
