import { Hono } from 'hono';
import { z } from 'zod';
import pLimit from 'p-limit';
import { getResolvedNetworks, getSdk } from '../clients';
import { TtlCache } from '../cache';

export const validatorRoutes = new Hono();

const listQuery = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  view: z.enum(['execution', 'consensus', 'snapshot']).default('execution'),
  cursor: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const detailQuery = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  id: z.coerce.bigint().refine((v) => v >= 0n, 'id must be non-negative'),
});

type ValidatorListItem = {
  validatorId: string;
  authAddress: string;
  commission: string;
  stake: { execution: string; consensus: string; snapshot: string };
  unclaimedRewards: string;
  flagsRaw: string;
};

type ValidatorListResponse = {
  items: ValidatorListItem[];
  cursor: { next: number | null; prev: number | null };
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

validatorRoutes.get('/', async (c) => {
  const parsed = listQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  const { network, view, cursor, limit } = parsed.data;

  const cacheKey = `list:${network}:${view}:${cursor}:${limit}`;
  const cached = listCache.get(cacheKey);
  if (cached) return c.json(cached);

  const resolved = getResolvedNetworks()[network];
  if (!resolved) return c.json({ error: 'Network not configured' }, 400);

  try {
    const sdk = getSdk(resolved);
    const method =
      view === 'execution'
        ? sdk.getExecutionValidatorSet.bind(sdk)
        : view === 'consensus'
        ? sdk.getConsensusValidatorSet.bind(sdk)
        : sdk.getSnapshotValidatorSet.bind(sdk);

    const page = await method(cursor);
    const ids = page.validatorIds.slice(0, limit);

    const limiter = pLimit(8);
    const details = await Promise.allSettled(
      ids.map((id: bigint) => limiter(() => sdk.getValidator(id))),
    );

    const items: ValidatorListItem[] = ids.map((id: bigint, i: number) => {
      const d = details[i];
      if (d.status !== 'fulfilled') {
        return {
          validatorId: id.toString(),
          authAddress: '0x',
          commission: '—',
          stake: { execution: '—', consensus: '—', snapshot: '—' },
          unclaimedRewards: '—',
          flagsRaw: '0',
        };
      }
      const v = d.value;
      return {
        validatorId: id.toString(),
        authAddress: v.authAddress,
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
      };
    });

    const count = ids.length;
    const response: ValidatorListResponse = {
      items,
      cursor: {
        prev: cursor > 0 ? Math.max(0, cursor - count) : null,
        next: page.isDone ? null : page.nextIndex,
      },
      isDone: page.isDone,
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
  const idStr = c.req.param('id');
  const parsed = detailQuery.safeParse({ network, id: BigInt(idStr) });
  if (!parsed.success) return c.json({ error: 'Invalid params', details: parsed.error.flatten() }, 400);

  const { network: net, id } = parsed.data;
  const cacheKey = `detail:${net}:${id.toString()}`;
  const cached = detailCache.get(cacheKey);
  if (cached) return c.json(cached);

  const resolved = getResolvedNetworks()[net];
  if (!resolved) return c.json({ error: 'Network not configured' }, 400);

  try {
    const sdk = getSdk(resolved);
    const v = await sdk.getValidator(id);
    const payload = {
      validatorId: id.toString(),
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
    return c.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch validator';
    return c.json({ error: message }, 500);
  }
});


