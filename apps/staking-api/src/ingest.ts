import pLimit from 'p-limit';
import { getResolvedNetworks, getSdk } from './clients';
import { validatorsCol, type ValidatorDoc } from './db';
import { listValidatorInfo, fetchValidatorJsonFromApi, type NetworkFolder } from './github';
import { logger } from './logger';

function formatMonStr(v: bigint): string { return v.toString(); }

function mapFolder(key: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2'): NetworkFolder {
  if (key === 'monad-mainnet') return 'mainnet';
  if (key === 'monad-testnet-2') return 'testnet-2';
  return 'testnet';
}

export async function ingestAllValidators(networkKey: 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2') {
  const resolved = getResolvedNetworks()[networkKey];
  if (!resolved) throw new Error(`Network ${networkKey} not configured`);
  const sdk = getSdk(resolved);
  const col = await validatorsCol();
  logger.info('ingest start scan', { network: networkKey });

  // First, walk known validator sets (execution/snapshot) to seed ids
  const discovered = new Set<string>();
  {
    let cursor = 0;
    for (let i = 0; i < 1000; i++) {
      const page = await sdk.getExecutionValidatorSet(cursor);
      for (const id of page.validatorIds) discovered.add(id.toString());
      if (page.isDone) break;
      cursor = page.nextIndex;
    }
  }
  {
    let cursor = 0;
    for (let i = 0; i < 1000; i++) {
      const page = await sdk.getSnapshotValidatorSet(cursor);
      for (const id of page.validatorIds) discovered.add(id.toString());
      if (page.isDone) break;
      cursor = page.nextIndex;
    }
  }

  // Then, scan by id from 0 upward until 5 consecutive misses
  let id = 0n;
  let misses = 0;
  const limiter = pLimit(6);
  const batch: Promise<void>[] = [];
  let upserts = 0;
  while (misses < 5) {
    const current = id;
    id++;
    batch.push(limiter(async () => {
      try {
        const v = await sdk.getValidator(current);
        // Heuristic: if all stakes are zero and no keys, count as miss
        const empty = v.stake === 0n && v.consensusStake === 0n && v.snapshotStake === 0n;
        if (empty) {
          misses++;
          return;
        }
        misses = 0;
        discovered.add(current.toString());
        const doc: ValidatorDoc = {
          _id: `${networkKey}:${current.toString()}`,
          network: networkKey,
          validatorId: current.toString(),
          authAddress: v.authAddress,
          commission: v.commission.toString(),
          stake: {
            execution: formatMonStr(v.stake),
            consensus: formatMonStr(v.consensusStake),
            snapshot: formatMonStr(v.snapshotStake),
          },
          unclaimedRewards: v.unclaimedRewards.toString(),
          flagsRaw: v.flags.toString(),
          keys: { secpPubkey: normalizeHexNo0x(v.secpPubkey), blsPubkey: v.blsPubkey },
          // isActive will be set after we fetch consensus set below
          isActive: undefined,
          activeEpoch: undefined,
          updatedAt: new Date().toISOString(),
        };
        await col.updateOne(
          { _id: doc._id },
          { $set: doc },
          { upsert: true },
        );
        upserts++;
      } catch (err) {
        // Count as miss, log occasionally
        misses++;
        if (misses % 5 === 0) {
          logger.warn(`[ingest] ${networkKey} validator ${current.toString()} scan error`, err);
        }
      }
    }));
    if (batch.length >= 64) {
      await Promise.allSettled(batch.splice(0));
    }
  }
  await Promise.allSettled(batch);
  logger.info('ingest scan complete', { network: networkKey, discovered: discovered.size, upserts });

  // After scan, fetch current consensus set once and update isActive flags immediately (so restart reflects active status)
  try {
    let cursor = 0;
    const activeIds = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const page = await sdk.getConsensusValidatorSet(cursor);
      for (const id of page.validatorIds) activeIds.add(id.toString());
      if (page.isDone) break;
      cursor = page.nextIndex;
    }
    const activeList = Array.from(activeIds);
    const vcol = await validatorsCol();
    // Do not reset all flags here (worker handles epoch transitions); only set true for current actives
    if (activeList.length > 0) {
      await vcol.updateMany({ network: networkKey, validatorId: { $in: activeList } }, { $set: { isActive: true } });
    }
    logger.info('ingest consensus flags updated', { network: networkKey, activeCount: activeList.length });
  } catch (e) {
    logger.warn('ingest consensus flag update failed', { network: networkKey, error: String(e) });
  }

  // Enrich with GitHub metadata by secp key when available (handles JSON and non-JSON files)
  try {
    const folder = mapFolder(networkKey);
    const files = await listValidatorInfo(folder);
    // Attempt to read JSON when available; otherwise derive secp key from filename/content
    let enriched = 0;
    for (const f of files) {
      try {
        let secp: string | undefined;
        let name: string | undefined;
        let website: string | undefined;
        let description: string | undefined;
        let logo: string | undefined;
        let contacts: Record<string, string> | undefined;

        // Prefer GitHub Contents API (base64 content) to avoid raw file assumptions
        const metaObj = await fetchValidatorJsonFromApi(f.url);
        if (metaObj) {
          const secpHex = extractString(metaObj, ['secpPubkey', 'secp_pubkey', 'secpPublicKey']);
          secp = secpHex ? normalizeHexNo0x(secpHex) : undefined;
          name = extractString(metaObj, ['name']);
          website = extractString(metaObj, ['website']);
          description = extractString(metaObj, ['description']);
          logo = extractString(metaObj, ['logo']);
          contacts = extractRecord(metaObj, ['contacts']);
        }

        // Fallbacks when API content isn't JSON or doesn't contain fields
        if (!secp) {
          const secpFromName = extractCompressedSecpFromName(f.name);
          if (secpFromName) secp = secpFromName;
        }
        if (!secp && f.downloadUrl) {
          const res = await fetch(f.downloadUrl);
          if (res.ok) {
            const text = await res.text();
            secp = extractCompressedSecpFromText(text);
          }
        }

        if (!secp) continue;
        const upd = await col.updateMany(
          { network: networkKey, 'keys.secpPubkey': secp },
          { $set: { meta: { name, website, description, logoUrl: logo, contacts, githubPath: f.path, githubSha: f.sha } } },
        );
        if (upd.modifiedCount > 0 || upd.upsertedCount > 0) enriched += upd.modifiedCount + upd.upsertedCount;
      } catch (err) {
        logger.warn('ingest enrich file failed', { path: f.path, error: String(err) });
      }
    }
    logger.info('ingest enrichment complete', { network: networkKey, files: files.length, enriched });
  } catch (err) {
    logger.warn('ingest enrichment skipped/failed', { network: networkKey, error: String(err) });
  }
}

function extractString(source: unknown, keys: readonly string[]): string | undefined {
  if (typeof source !== 'object' || source === null) return undefined;
  const obj = source as Record<string, unknown>;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string') return v;
  }
  return undefined;
}

function extractRecord(source: unknown, keys: readonly string[]): Record<string, string> | undefined {
  if (typeof source !== 'object' || source === null) return undefined;
  const obj = source as Record<string, unknown>;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'object' && v !== null) {
      const rec = v as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [rk, rv] of Object.entries(rec)) {
        if (typeof rv === 'string') out[rk] = rv;
      }
      return out;
    }
  }
  return undefined;
}

function normalizeHexNo0x(value: string): string {
  if (value.startsWith('0x') || value.startsWith('0X')) return value.slice(2);
  return value;
}

function isHex(s: string): boolean {
  return /^[0-9a-fA-F]+$/.test(s);
}

function extractCompressedSecpFromName(name: string): string | undefined {
  // Compressed secp pubkey is 33 bytes => 66 hex chars; often filename is the key
  const base = name.includes('.') ? name.slice(0, name.indexOf('.')) : name;
  if (base.length === 66 && (base.startsWith('02') || base.startsWith('03')) && isHex(base)) {
    return base.toLowerCase();
  }
  return undefined;
}

function extractCompressedSecpFromText(text: string): string | undefined {
  const match = text.match(/\b(02|03)[0-9a-fA-F]{64}\b/);
  return match ? match[0].toLowerCase() : undefined;
}


