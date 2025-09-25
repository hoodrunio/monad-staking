import { MongoClient, type Db, type Collection } from 'mongodb';
import Redis from 'ioredis';

export interface ValidatorDoc {
  _id: string; // validatorId as string
  network: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2';
  validatorId: string;
  // on-chain
  authAddress: string;
  commission: string; // bigint string
  stake: {
    execution: string; // bigint string
    consensus: string; // bigint string
    snapshot: string; // bigint string
  };
  unclaimedRewards: string; // bigint string
  flagsRaw: string; // bigint string
  keys?: {
    secpPubkey?: string;
    blsPubkey?: string;
  };
  // enrichment
  meta?: {
    name?: string;
    website?: string;
    description?: string;
    logoUrl?: string;
    contacts?: Record<string, string>;
    // raw GitHub JSON blob or reference
    githubPath?: string;
    githubSha?: string;
  };
  updatedAt: string; // ISO
}

export interface EpochStateDoc {
  _id: string; // network
  epoch: string; // bigint string
  inEpochDelayPeriod: boolean;
  updatedAt: string; // ISO
}

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let redisClient: Redis | null = null;

export async function getMongo(): Promise<Db> {
  if (mongoDb) return mongoDb;
  const url = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'monad_staking';
  if (!url) throw new Error('MONGODB_URI is required');
  mongoClient = new MongoClient(url, { maxPoolSize: 5 });
  await mongoClient.connect();
  mongoDb = mongoClient.db(dbName);
  return mongoDb;
}

export function getRedis(): Redis {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  redisClient = url ? new Redis(url) : new Redis();
  return redisClient;
}

export async function validatorsCol(db?: Db): Promise<Collection<ValidatorDoc>> {
  const database = db ?? (await getMongo());
  const col = database.collection<ValidatorDoc>('validators');
  await col.createIndex({ network: 1, validatorId: 1 }, { unique: true });
  await col.createIndex({ network: 1, 'keys.secpPubkey': 1 });
  return col;
}

export async function epochCol(db?: Db): Promise<Collection<EpochStateDoc>> {
  const database = db ?? (await getMongo());
  const col = database.collection<EpochStateDoc>('epoch_state');
  return col;
}


