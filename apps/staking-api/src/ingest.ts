import pLimit from 'p-limit';
import { getResolvedNetworks, getSdk } from './clients';
import { validatorsCol, type ValidatorDoc } from './db';
import { listValidatorInfo, fetchValidatorJsonFromApi, type NetworkFolder } from './github';

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
  console.log(`[ingest] start scan for ${networkKey}`);

  // First, walk known validator sets (execution/consensus/snapshot) to seed ids
  const sets = [sdk.getExecutionValidatorSet.bind(sdk), sdk.getConsensusValidatorSet.bind(sdk), sdk.getSnapshotValidatorSet.bind(sdk)];
  const discovered = new Set<string>();
  const consensusSet = new Set<string>();
  for (const method of sets) {
    let cursor = 0;
    // cap iterations defensively
    for (let i = 0; i < 1000; i++) {
      const page = await method(cursor);
      for (const id of page.validatorIds) {
        const s = id.toString();
        discovered.add(s);
        if (method === sdk.getConsensusValidatorSet.bind(sdk)) {
          consensusSet.add(s);
        }
      }
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
          isActive: consensusSet.has(current.toString()),
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
          console.warn(`[ingest] ${networkKey} validator ${current.toString()} scan error`, err);
        }
      }
    }));
    if (batch.length >= 64) {
      await Promise.allSettled(batch.splice(0));
    }
  }
  await Promise.allSettled(batch);
  console.log(`[ingest] scan complete for ${networkKey}: discovered=${discovered.size} upserts=${upserts} consensus=${consensusSet.size}`);

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
        console.warn(`[ingest] enrich file failed ${f.path}`, err);
      }
    }
    console.log(`[ingest] enrichment complete for ${networkKey}: files=${files.length} enriched=${enriched}`);
  } catch (err) {
    console.warn(`[ingest] enrichment skipped or failed for ${networkKey}`, err);
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


