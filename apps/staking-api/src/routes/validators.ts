import { Hono } from 'hono';
import { z } from 'zod';
import { getResolvedNetworks, getSdk } from '../clients';
import { TtlCache } from '../cache';
import { validatorsCol, type ValidatorDoc } from '../db';
import { logger } from '../logger';

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
  commission: string;
  stake: { execution: string; consensus: string; snapshot: string };
  unclaimedRewards: string;
  flagsRaw: string;
  meta?: { name?: string; website?: string; logoUrl?: string };
};

type ValidatorListResponse = {
  items: ValidatorListItem[];
  cursor: { next: string | null; prev: string | null };
  isDone: boolean;
};

type ValidatorDetailResponse = {
  validatorId: string;
  authAddress: string;
  commissionRaw: string;
  commission: string;
  stake: { execution: string; consensus: string; snapshot: string };
  unclaimedRewards: string;
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
};

function formatMon(value: bigint): string {
  const decimals = 18n;
  const sign = value < 0n ? '-' : '';
  const abs = value < 0n ? -value : value;
  const int = abs / (10n ** decimals);
  const frac = (abs % (10n ** decimals)).toString().padStart(Number(decimals), '0').slice(0, 4).replace(/0+$/, '');
  return `${sign}${int.toString()}${frac ? '.' + frac : ''} MON`;
}

const listCache = new TtlCache<ValidatorListResponse>(30_000);
const detailCache = new TtlCache<ValidatorDetailResponse>(120_000);

function normalizeHexNo0x(input: string): string | null {
  const trimmed = input.trim();
  const no0x = trimmed.startsWith('0x') || trimmed.startsWith('0X') ? trimmed.slice(2) : trimmed;
  return /^[0-9a-fA-F]+$/.test(no0x) ? no0x.toLowerCase() : null;
}

function isDecimalId(input: string): boolean {
  return /^\d+$/.test(input);
}

function detectAddressHex(input: string): string | null {
  const m = input.match(/^0x([0-9a-fA-F]{40})$/);
  if (m) return m[1].toLowerCase();
  return null;
}

validatorRoutes.get('/', async (c) => {
  const parsed = listQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  const { network, cursor, limit } = parsed.data;

  const cacheKey = `list-db:${network}:${cursor}:${limit}`;
  const cached = listCache.get(cacheKey);
  if (cached) return c.json(cached);

  try {
    const col = await validatorsCol();
    const filter = { network };
    const query = cursor ? { ...filter, validatorId: { $gt: cursor } } : filter;
    const docs = await col.find(query, { sort: { validatorId: 1 }, limit }).toArray();

    const items: ValidatorListItem[] = docs.map((d: ValidatorDoc) => {
      const commissionBig = BigInt(d.commission);
      const scaled = (commissionBig * 10000n) / (10n ** 18n);
      const integer = scaled / 100n;
      const fraction = (scaled % 100n).toString().padStart(2, '0').replace(/0+$/, '');
      const commission = fraction ? `${integer.toString()}.${fraction}%` : `${integer.toString()}%`;
      return {
        validatorId: d.validatorId,
        authAddress: d.authAddress,
        commission,
        stake: {
          execution: formatMon(BigInt(d.stake.execution)),
          consensus: formatMon(BigInt(d.stake.consensus)),
          snapshot: formatMon(BigInt(d.stake.snapshot)),
        },
        unclaimedRewards: formatMon(BigInt(d.unclaimedRewards)),
        flagsRaw: d.flagsRaw,
        keys: { secpPubkey: d.keys?.secpPubkey ?? '', blsPubkey: d.keys?.blsPubkey ?? '' },
        meta: d.meta
          ? { name: d.meta.name, website: d.meta.website, logoUrl: d.meta.logoUrl }
          : undefined,
      };
    });

    const next = docs.length === limit ? docs[docs.length - 1]!.validatorId : null;
    const response: ValidatorListResponse = {
      items,
      cursor: { prev: null, next },
      isDone: next === null,
    };
    listCache.set(cacheKey, response);
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
    secp = secpParam ? normalizeHexNo0x(secpParam) : null;
    auth = authParam ? normalizeHexNo0x(authParam) : detectAddressHex(idParam);
    if (!secp && !auth) {
      // If still nothing, as a last attempt treat path as hex (could be secp without 0x)
      const maybeHex = normalizeHexNo0x(idParam);
      if (maybeHex && maybeHex.length >= 40) secp = maybeHex;
    }
    if (!secp && !auth) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Provide a numeric validator id, or a valid secp/auth address (?secp=... or ?auth=0x...)' } }, 400);
    }
  }

  const cacheKey = `detail:${net}:${idBig !== null ? idBig.toString() : `secp:${secp}`}`;
  const cached = detailCache.get(cacheKey);
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
      const commissionBig = BigInt(doc.commission);
      const scaled = (commissionBig * 10000n) / (10n ** 18n);
      const integer = scaled / 100n;
      const fraction = (scaled % 100n).toString().padStart(2, '0').replace(/0+$/, '');
      const payload = {
        validatorId: doc.validatorId,
        authAddress: doc.authAddress,
        commissionRaw: doc.commission,
        commission: fraction ? `${integer.toString()}.${fraction}%` : `${integer.toString()}%`,
        stake: {
          execution: formatMon(BigInt(doc.stake.execution)),
          consensus: formatMon(BigInt(doc.stake.consensus)),
          snapshot: formatMon(BigInt(doc.stake.snapshot)),
        },
        unclaimedRewards: formatMon(BigInt(doc.unclaimedRewards)),
        flagsRaw: doc.flagsRaw,
        keys: { secpPubkey: doc.keys?.secpPubkey ?? '', blsPubkey: doc.keys?.blsPubkey ?? '' },
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
      } as ValidatorDetailResponse;
      detailCache.set(cacheKey, payload);
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
    const payload: ValidatorDetailResponse = {
      validatorId: idBig.toString(),
      authAddress: v.authAddress,
      commissionRaw: v.commission.toString(),
      commission: (() => {
        const scaled = (v.commission * 10000n) / (10n ** 18n);
        const integer = scaled / 100n;
        const fraction = (scaled % 100n).toString().padStart(2, '0').replace(/0+$/, '');
        return fraction ? `${integer.toString()}.${fraction}%` : `${integer.toString()}%`;
      })(),
      stake: {
        execution: formatMon(v.stake),
        consensus: formatMon(v.consensusStake),
        snapshot: formatMon(v.snapshotStake),
      },
      unclaimedRewards: formatMon(v.unclaimedRewards),
      flagsRaw: v.flags.toString(),
      keys: { secpPubkey: v.secpPubkey, blsPubkey: v.blsPubkey },
    };
    detailCache.set(cacheKey, payload);
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
            keys: { secpPubkey: v.secpPubkey, blsPubkey: v.blsPubkey },
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


