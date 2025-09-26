import pLimit from 'p-limit';
import { getResolvedNetworks, getSdk } from '../infra/clients';
import { ingestStateCol, validatorsCol, type ValidatorDoc } from '../infra/db';
import { listValidatorInfo, fetchValidatorJsonFromApi, type NetworkFolder } from './github';
import { logger } from '../infra/logger';
import { normalizeHexNo0x, normalizeSecpKey } from '../lib/key-format';
import { ingestConfig } from '../config/env';

const MISS_THRESHOLD = Math.max(1, ingestConfig.missThreshold);
const SCAN_BATCH_SIZE = Math.max(1, ingestConfig.batchSize);
const RESUME_LOOKBACK = ingestConfig.resumeLookback;

export async function ingestAllValidators(networkKey: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2') {
  const resolved = getResolvedNetworks()[networkKey];
  if (!resolved) throw new Error(`Network ${networkKey} not configured`);
  const sdk = getSdk(resolved);
  const validators = await validatorsCol();
  const ingestState = await ingestStateCol();

  logger.info('ingest.start', { network: networkKey });

  const knownIds = await fetchKnownValidatorIds(sdk);
  if (knownIds.size > 0) {
    await upsertBatch(Array.from(knownIds).map((id) => BigInt(id)), networkKey, sdk, validators);
  }

  await normalizeStoredSecpKeys(networkKey, validators);

  const scanStats = await scanSequentialIds({
    networkKey,
    sdk,
    validators,
    ingestState,
    knownIds,
  });

  logger.info('ingest.scan.complete', {
    network: networkKey,
    ...scanStats,
  });

  await updateConsensusStatuses(networkKey, sdk);
  await enrichValidatorMetadata(networkKey, validators);
}

type SequentialScanParams = {
  networkKey: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2';
  sdk: ReturnType<typeof getSdk>;
  validators: Awaited<ReturnType<typeof validatorsCol>>;
  ingestState: Awaited<ReturnType<typeof ingestStateCol>>;
  knownIds: Set<string>;
};

type ScanStats = {
  scanned: number;
  created: number;
  updated: number;
  batches: number;
  misses: number;
  nextValidatorId: string;
};

async function scanSequentialIds({ networkKey, sdk, validators, ingestState, knownIds }: SequentialScanParams): Promise<ScanStats> {
  const state = await ingestState.findOne({ _id: networkKey });
  const resumePointer = state ? BigInt(state.nextValidatorId) : 0n;
  const startFrom = resumePointer > RESUME_LOOKBACK ? resumePointer - RESUME_LOOKBACK : 0n;
  let cursor = startFrom;
  let highWater = resumePointer > startFrom ? resumePointer : startFrom;
  let misses = 0;
  let scanned = 0;
  let created = 0;
  let updated = 0;
  let batches = 0;

  while (misses < MISS_THRESHOLD) {
    const ids: bigint[] = [];
    for (let i = 0; i < SCAN_BATCH_SIZE; i++) {
      ids.push(cursor + BigInt(i));
    }

    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const validator = await sdk.getValidator(id);
          return { id, validator } as const;
        } catch (error) {
          return { id, error } as const;
        }
      }),
    );

    batches++;

    for (const result of results) {
      highWater = result.id + 1n;
      scanned++;
      if ('error' in result) {
        misses++;
        continue;
      }

      const { validator } = result;
      const empty = validator.stake === 0n && validator.consensusStake === 0n && validator.snapshotStake === 0n;
      if (empty) {
        misses++;
        continue;
      }

      misses = 0;
      const doc = buildValidatorDoc(networkKey, result.id, validator);
      const updateResult = await validators.updateOne(
        { _id: doc._id },
        { $set: doc },
        { upsert: true },
      );

      const idStr = doc.validatorId;
      if (updateResult.upsertedCount > 0) {
        created++;
      } else if (updateResult.modifiedCount > 0) {
        updated++;
      }
      knownIds.add(idStr);
    }

    await ingestState.updateOne(
      { _id: networkKey },
      {
        $set: {
          nextValidatorId: highWater.toString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    cursor = highWater;
    if (misses >= MISS_THRESHOLD) break;
  }

  return {
    scanned,
    created,
    updated,
    batches,
    misses,
    nextValidatorId: highWater.toString(),
  };
}

async function upsertBatch(
  ids: bigint[],
  networkKey: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2',
  sdk: ReturnType<typeof getSdk>,
  validators: Awaited<ReturnType<typeof validatorsCol>>,
): Promise<void> {
  const limiter = pLimit(8);
  await Promise.all(
    ids.map((id) =>
      limiter(async () => {
        try {
          const validator = await sdk.getValidator(id);
          const empty = validator.stake === 0n && validator.consensusStake === 0n && validator.snapshotStake === 0n;
          if (empty) return;
          const doc = buildValidatorDoc(networkKey, id, validator);
          await validators.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
        } catch (error) {
          logger.warn('ingest.seed.failed', {
            network: networkKey,
            validatorId: id.toString(),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    ),
  );
}

function buildValidatorDoc(
  networkKey: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2',
  id: bigint,
  validator: Awaited<ReturnType<ReturnType<typeof getSdk>['getValidator']>>,
): ValidatorDoc {
  const secp = normalizeSecpKey(validator.secpPubkey) ?? undefined;
  const keys: ValidatorDoc['keys'] = {};
  if (secp) keys.secpPubkey = secp;
  if (validator.blsPubkey) keys.blsPubkey = validator.blsPubkey;

  const doc: ValidatorDoc = {
    _id: `${networkKey}:${id.toString()}`,
    network: networkKey,
    validatorId: id.toString(),
    authAddress: validator.authAddress,
    commission: validator.commission.toString(),
    stake: {
      execution: validator.stake.toString(),
      consensus: validator.consensusStake.toString(),
      snapshot: validator.snapshotStake.toString(),
    },
    unclaimedRewards: validator.unclaimedRewards.toString(),
    flagsRaw: validator.flags.toString(),
    updatedAt: new Date().toISOString(),
  };

  if (Object.keys(keys).length > 0) doc.keys = keys;

  return doc;
}

async function fetchKnownValidatorIds(sdk: ReturnType<typeof getSdk>): Promise<Set<string>> {
  const discovered = new Set<string>();
  let cursor = 0;
  for (let i = 0; i < 1000; i++) {
    const page = await sdk.getExecutionValidatorSet(cursor);
    for (const id of page.validatorIds) discovered.add(id.toString());
    if (page.isDone) break;
    cursor = page.nextIndex;
  }

  cursor = 0;
  for (let i = 0; i < 1000; i++) {
    const page = await sdk.getSnapshotValidatorSet(cursor);
    for (const id of page.validatorIds) discovered.add(id.toString());
    if (page.isDone) break;
    cursor = page.nextIndex;
  }

  return discovered;
}

async function updateConsensusStatuses(
  networkKey: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2',
  sdk: ReturnType<typeof getSdk>,
): Promise<void> {
  try {
    let cursor = 0;
    const activeIds = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const page = await sdk.getConsensusValidatorSet(cursor);
      for (const id of page.validatorIds) activeIds.add(id.toString());
      if (page.isDone) break;
      cursor = page.nextIndex;
    }
    const validators = await validatorsCol();
    if (activeIds.size > 0) {
      await validators.updateMany(
        { network: networkKey, validatorId: { $in: Array.from(activeIds) } },
        { $set: { isActive: true } },
      );
    }
    logger.info('ingest.consensus.updated', {
      network: networkKey,
      activeCount: activeIds.size,
    });
  } catch (error) {
    logger.warn('ingest.consensus.failed', {
      network: networkKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function normalizeStoredSecpKeys(
  networkKey: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2',
  validators: Awaited<ReturnType<typeof validatorsCol>>,
): Promise<void> {
  const cursor = validators.find(
    { network: networkKey, 'keys.secpPubkey': { $exists: true } },
    { projection: { _id: 1, 'keys.secpPubkey': 1 } },
  );

  const updates: Promise<unknown>[] = [];
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) break;
    const secpValue = doc.keys?.secpPubkey;
    if (typeof secpValue !== 'string') continue;
    const normalized = normalizeSecpKey(secpValue) ?? normalizeHexNo0x(secpValue);
    if (!normalized || normalized === secpValue) continue;
    updates.push(
      validators.updateOne(
        { _id: doc._id },
        { $set: { 'keys.secpPubkey': normalized } },
      ),
    );
  }
  if (updates.length > 0) {
    await Promise.allSettled(updates);
    logger.info('ingest.secp.normalized', { network: networkKey, updates: updates.length });
  }
}

async function enrichValidatorMetadata(
  networkKey: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2',
  validators: Awaited<ReturnType<typeof validatorsCol>>,
): Promise<void> {
  try {
    const folder = mapFolder(networkKey);
    const files = await listValidatorInfo(folder);
    let enriched = 0;

    for (const file of files) {
      try {
        const meta = await fetchValidatorMetadata(file.url, file.name, file.downloadUrl);
        if (!meta) continue;
        const { secp, data } = meta;
        const filterValues = [secp, secp.toUpperCase(), `0x${secp}`, `0X${secp}`];
        const result = await validators.updateMany(
          {
            network: networkKey,
            $or: filterValues.map((value) => ({ 'keys.secpPubkey': value })),
          },
          {
            $set: {
              meta: { ...data, githubPath: file.path, githubSha: file.sha },
              'keys.secpPubkey': secp,
            },
          },
        );
        if (result.modifiedCount > 0) {
          enriched += result.modifiedCount;
        }
      } catch (error) {
        logger.warn('ingest.metadata.file_failed', {
          network: networkKey,
          path: file.path,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('ingest.metadata.complete', {
      network: networkKey,
      files: files.length,
      enriched,
    });
  } catch (error) {
    logger.warn('ingest.metadata.skipped', {
      network: networkKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function fetchValidatorMetadata(url: string, name: string, downloadUrl?: string): Promise<{
  secp: string;
  data: {
    name?: string;
    website?: string;
    description?: string;
    logoUrl?: string;
    contacts?: Record<string, string>;
  };
} | null> {
  const metaObj = await fetchValidatorJsonFromApi(url);
  let secp: string | undefined;
  let nameField: string | undefined;
  let website: string | undefined;
  let description: string | undefined;
  let logo: string | undefined;
  let contacts: Record<string, string> | undefined;

  if (metaObj) {
    const secpCandidate = extractString(metaObj, ['secpPubkey', 'secp_pubkey', 'secpPublicKey']);
    secp = secpCandidate ? normalizeSecpKey(secpCandidate) ?? undefined : undefined;
    nameField = extractString(metaObj, ['name']);
    website = extractString(metaObj, ['website']);
    description = extractString(metaObj, ['description']);
    logo = extractString(metaObj, ['logo']);
    contacts = extractRecord(metaObj, ['contacts']);
  }

  if (!secp) {
    const fromName = extractCompressedSecpFromName(name);
    if (fromName) secp = fromName;
  }

  if (!secp && downloadUrl) {
    const res = await fetch(downloadUrl);
    if (res.ok) {
      const text = await res.text();
      const fromText = extractCompressedSecpFromText(text);
      if (fromText) secp = fromText;
    }
  }

  if (!secp) return null;

  return {
    secp,
    data: {
      name: nameField,
      website,
      description,
      logoUrl: logo,
      contacts,
    },
  };
}

function mapFolder(key: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2'): NetworkFolder {
  if (key === 'monad-mainnet') return 'mainnet';
  if (key === 'monad-testnet-2') return 'testnet-2';
  return 'testnet';
}

function extractString(source: unknown, keys: readonly string[]): string | undefined {
  if (typeof source !== 'object' || source === null) return undefined;
  const obj = source as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string') return value;
  }
  return undefined;
}

function extractRecord(source: unknown, keys: readonly string[]): Record<string, string> | undefined {
  if (typeof source !== 'object' || source === null) return undefined;
  const obj = source as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      const input = value as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(input)) {
        if (typeof v === 'string') out[k] = v;
      }
      return out;
    }
  }
  return undefined;
}

function extractCompressedSecpFromName(filename: string): string | undefined {
  const base = filename.includes('.') ? filename.slice(0, filename.indexOf('.')) : filename;
  if (base.length === 66 && (base.startsWith('02') || base.startsWith('03'))) {
    return base.toLowerCase();
  }
  return undefined;
}

function extractCompressedSecpFromText(text: string): string | undefined {
  const match = text.match(/\b(02|03)[0-9a-fA-F]{64}\b/);
  return match ? match[0].toLowerCase() : undefined;
}
