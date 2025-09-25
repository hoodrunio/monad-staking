import pLimit from 'p-limit';
import { getResolvedNetworks, getSdk } from './clients';
import { validatorsCol, type ValidatorDoc } from './db';
import { listValidatorInfo, downloadValidatorJson, type NetworkFolder } from './github';

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

  // First, walk known validator sets (execution/consensus/snapshot) to seed ids
  const sets = [sdk.getExecutionValidatorSet.bind(sdk), sdk.getConsensusValidatorSet.bind(sdk), sdk.getSnapshotValidatorSet.bind(sdk)];
  const discovered = new Set<string>();
  for (const method of sets) {
    let cursor = 0;
    // cap iterations defensively
    for (let i = 0; i < 1000; i++) {
      const page = await method(cursor);
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
          keys: { secpPubkey: v.secpPubkey, blsPubkey: v.blsPubkey },
          updatedAt: new Date().toISOString(),
        };
        await col.updateOne(
          { _id: doc._id },
          { $set: doc },
          { upsert: true },
        );
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

  // Enrich with GitHub metadata by secp key filename prefix when available
  try {
    const folder = mapFolder(networkKey);
    const files = await listValidatorInfo(folder);
    // naive approach: load gzip-like JSONs and attempt to match via content.secpPubkey or filename
    for (const f of files) {
      if (!f.downloadUrl) continue;
      try {
        const json = await downloadValidatorJson(f.downloadUrl);
        const metaObj = json as unknown;
        const secpHex = extractString(metaObj, ['secpPubkey', 'secp_pubkey', 'secpPublicKey']);
        const secp = secpHex ? normalizeHexNo0x(secpHex) : undefined;
        if (!secp) continue;
        const name = extractString(metaObj, ['name']);
        const website = extractString(metaObj, ['website']);
        const description = extractString(metaObj, ['description']);
        const logo = extractString(metaObj, ['logo']);
        const contacts = extractRecord(metaObj, ['contacts']);
        // Attempt match by secp key
        await col.updateMany(
          { network: networkKey, 'keys.secpPubkey': secp },
          { $set: { meta: { name, website, description, logoUrl: logo, contacts, githubPath: f.path, githubSha: f.sha } } },
        );
      } catch (err) {
        console.warn(`[ingest] enrich file failed ${f.path}`, err);
      }
    }
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


