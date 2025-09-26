import { Hono } from 'hono';
import { z } from 'zod';
import { getResolvedNetworks, getSdk } from '../clients';
import { createHybridCache } from '../cache';
import { validatorsCol, type ValidatorDoc } from '../db';
import { logger } from '../logger';
import { normalizeAmount, normalizeCommission, type AmountField, type CommissionField } from '../format';
import { normalizeHexNo0x, normalizeSecpKey, ensure0x, normalizeAddress } from '../key-format';

export const validatorRoutes = new Hono();

const listQuery = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  cursor: z.string().default(''),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const detailQuery = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
});

type ValidatorListItem = {
  validatorId: string;
  authAddress: string;
  commission: CommissionField;
  stake: {
    execution: AmountField;
    consensus: AmountField;
    snapshot: AmountField;
  };
  unclaimedRewards: AmountField;
  flagsRaw: string;
  keys: { secpPubkey: string; blsPubkey: string };
  meta?: { name?: string; website?: string; logoUrl?: string };
  isActive?: boolean;
  activeEpoch?: string;
};

type ValidatorListResponse = {
  items: ValidatorListItem[];
  cursor: { next: string | null; prev: string | null };
  isDone: boolean;
};

type ValidatorDetailResponse = {
  validatorId: string;
  authAddress: string;
  commission: CommissionField;
  stake: {
    execution: AmountField;
    consensus: AmountField;
    snapshot: AmountField;
  };
  unclaimedRewards: AmountField;
  flagsRaw: string;
  keys: { secpPubkey: `${string}`; blsPubkey: `${string}` };
  meta?: {
    name?: string;
    website?: string;
    description?: string;
    logoUrl?: string;
    contacts?: Record<string, string>;
    githubPath?: string;
    githubSha?: string;
  };
  isActive?: boolean;
  activeEpoch?: string;
};

const listCache = createHybridCache<ValidatorListResponse>({ prefix: 'validators:list', ttlSeconds: 30 });
const detailCache = createHybridCache<ValidatorDetailResponse>({ prefix: 'validators:detail', ttlSeconds: 120 });

function isDecimalId(input: string): boolean {
  return /^\d+$/.test(input);
}

function detectAddressHex(input: string): string | null {
  return normalizeAddress(input) ?? null;
}

validatorRoutes.get('/', async (c) => {
  const parsed = listQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  const { network, cursor, limit } = parsed.data;

  const cacheKey = `list-db:${network}:${cursor}:${limit}`;
  const cached = await listCache.get(cacheKey);
  if (cached) return c.json(cached);

  try {
    const col = await validatorsCol();
    const filter = { network };
    const query = cursor ? { ...filter, validatorId: { $gt: cursor } } : filter;
    const docs = await col.find(query, { sort: { validatorId: 1 }, limit }).toArray();

    const items: ValidatorListItem[] = docs.map((d: ValidatorDoc) => ({
      validatorId: d.validatorId,
      authAddress: d.authAddress,
      commission: normalizeCommission(d.commission),
      stake: {
        execution: normalizeAmount(d.stake.execution),
        consensus: normalizeAmount(d.stake.consensus),
        snapshot: normalizeAmount(d.stake.snapshot),
      },
      unclaimedRewards: normalizeAmount(d.unclaimedRewards),
      flagsRaw: d.flagsRaw,
      keys: {
        secpPubkey: d.keys?.secpPubkey ? ensure0x(d.keys.secpPubkey) : '',
        blsPubkey: d.keys?.blsPubkey ?? '',
      },
      meta: d.meta
        ? { name: d.meta.name, website: d.meta.website, logoUrl: d.meta.logoUrl }
        : undefined,
      isActive: d.isActive,
      activeEpoch: d.activeEpoch,
    }));

    const next = docs.length === limit ? docs[docs.length - 1]!.validatorId : null;
    const response: ValidatorListResponse = {
      items,
      cursor: { prev: null, next },
      isDone: next === null,
    };
    await listCache.set(cacheKey, response);
    return c.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load validators';
    return c.json({ error: message }, 500);
  }
});

validatorRoutes.get('/:id', async (c) => {
  const url = new URL(c.req.url);
  const network = url.searchParams.get('network') ?? '';
  const idParam = c.req.param('id');
  const parsed = detailQuery.safeParse({ network });
  if (!parsed.success) return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid params', details: parsed.error.flatten() } }, 400);

  const net = parsed.data.network;
  // Determine selector by param type and optional query selectors
  let idBig: bigint | null = null;
  let secp: string | null = null;
  let auth: string | null = null;
  if (isDecimalId(idParam)) {
    idBig = BigInt(idParam);
  } else {
    const secpParam = url.searchParams.get('secp');
    const authParam = url.searchParams.get('auth');
    // Prefer explicit query, else infer from path param
    secp = secpParam ? normalizeSecpKey(secpParam) : null;
    auth = authParam ? normalizeHexNo0x(authParam) : detectAddressHex(idParam);
    if (!secp && !auth) {
      // If still nothing, as a last attempt treat path as hex (could be secp without 0x)
      const maybeHex = normalizeSecpKey(idParam) ?? normalizeHexNo0x(idParam);
      if (maybeHex && maybeHex.length >= 40) secp = maybeHex;
    }
    if (!secp && !auth) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Provide a numeric validator id, or a valid secp/auth address (?secp=... or ?auth=0x...)' } }, 400);
    }
  }

  const cacheKey = `detail:${net}:${idBig !== null ? idBig.toString() : `secp:${secp}`}`;
  const cached = await detailCache.get(cacheKey);
  if (cached) return c.json(cached);

  try {
    // Try DB first
    const col = await validatorsCol();
    const doc = idBig !== null
      ? await col.findOne({ _id: `${net}:${idBig.toString()}` })
      : secp
      ? await col.findOne({ network: net as 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2', 'keys.secpPubkey': secp })
      : await col.findOne({ network: net as 'monad-mainnet' | 'monad-testnet-1' | 'monad-testnet-2', authAddress: { $regex: new RegExp(`^0x${auth}$`, 'i') } });
    if (doc) {
      const payload: ValidatorDetailResponse = {
        validatorId: doc.validatorId,
        authAddress: doc.authAddress,
        commission: normalizeCommission(doc.commission),
        stake: {
          execution: normalizeAmount(doc.stake.execution),
          consensus: normalizeAmount(doc.stake.consensus),
          snapshot: normalizeAmount(doc.stake.snapshot),
        },
        unclaimedRewards: normalizeAmount(doc.unclaimedRewards),
        flagsRaw: doc.flagsRaw,
        keys: {
          secpPubkey: doc.keys?.secpPubkey ? ensure0x(doc.keys.secpPubkey) : '',
          blsPubkey: doc.keys?.blsPubkey ?? '',
        },
        meta: doc.meta
          ? {
              name: doc.meta.name,
              website: doc.meta.website,
              description: doc.meta.description,
              logoUrl: doc.meta.logoUrl,
              contacts: doc.meta.contacts,
              githubPath: doc.meta.githubPath,
              githubSha: doc.meta.githubSha,
            }
          : undefined,
        isActive: doc.isActive,
        activeEpoch: doc.activeEpoch,
      };
      await detailCache.set(cacheKey, payload);
      return c.json(payload);
    }

    // Fallback to chain read and upsert (only for numeric id)
    if (idBig === null) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Validator not found for provided secp key' } }, 404);
    }
    const resolved = getResolvedNetworks()[net];
    if (!resolved) return c.json({ error: { code: 'BAD_REQUEST', message: 'Network not configured' } }, 400);
    const sdk = getSdk(resolved);
    const v = await sdk.getValidator(idBig);
    const normalizedSecp = normalizeSecpKey(v.secpPubkey) ?? normalizeHexNo0x(v.secpPubkey);
    const payload: ValidatorDetailResponse = {
      validatorId: idBig.toString(),
      authAddress: v.authAddress,
      commission: normalizeCommission(v.commission),
      stake: {
        execution: normalizeAmount(v.stake),
        consensus: normalizeAmount(v.consensusStake),
        snapshot: normalizeAmount(v.snapshotStake),
      },
      unclaimedRewards: normalizeAmount(v.unclaimedRewards),
      flagsRaw: v.flags.toString(),
      keys: {
        secpPubkey: normalizedSecp ? ensure0x(normalizedSecp) : ensure0x(v.secpPubkey),
        blsPubkey: v.blsPubkey,
      },
    };
    await detailCache.set(cacheKey, payload);
    try {
      await (await validatorsCol()).updateOne(
        { _id: `${net}:${idBig.toString()}` },
        {
          $set: {
            _id: `${net}:${idBig.toString()}`,
            network: net,
            validatorId: idBig.toString(),
            authAddress: v.authAddress,
            commission: v.commission.toString(),
            stake: {
              execution: v.stake.toString(),
              consensus: v.consensusStake.toString(),
              snapshot: v.snapshotStake.toString(),
            },
            unclaimedRewards: v.unclaimedRewards.toString(),
            flagsRaw: v.flags.toString(),
            keys: {
              secpPubkey: normalizedSecp ?? undefined,
              blsPubkey: v.blsPubkey,
            },
            updatedAt: new Date().toISOString(),
          } as ValidatorDoc,
        },
        { upsert: true },
      );
    } catch (err) {
      logger.error(`[validators] failed to upsert validator ${idBig.toString()}`, err);
    }
    return c.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch validator';
    return c.json({ error: { code: 'INTERNAL_ERROR', message } }, 500);
  }
});
