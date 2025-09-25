import { Hono } from 'hono';
import { z } from 'zod';
import { getResolvedNetworks, getSdk } from '../clients';
import { TtlCache } from '../cache';

export const delegationsRoutes = new Hono();

const listQuery = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  cursor: z.coerce.bigint().default(0n),
});

function formatMon(value: bigint): string {
  const decimals = 18n;
  const sign = value < 0n ? '-' : '';
  const abs = value < 0n ? -value : value;
  const int = abs / (10n ** decimals);
  const frac = (abs % (10n ** decimals)).toString().padStart(Number(decimals), '0').slice(0, 4).replace(/0+$/, '');
  return `${sign}${int.toString()}${frac ? '.' + frac : ''} MON`;
}

type DelegationItem = {
  validatorId: string;
  stake: string;
  unclaimedRewards: string;
  deltaStake: string;
  nextDeltaStake: string;
  deltaEpoch: string;
  nextDeltaEpoch: string;
};

type DelegationsResponse = {
  items: DelegationItem[];
  cursor: { next: string; done: boolean };
};

const cache = new TtlCache<DelegationsResponse>(20_000);

delegationsRoutes.get('/', async (c) => {
  const parsed = listQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  const { network, address, cursor } = parsed.data;

  const cacheKey = `delegations:${network}:${address}:${cursor.toString()}`;
  const cached = cache.get(cacheKey);
  if (cached) return c.json(cached);

  const resolved = getResolvedNetworks()[network];
  if (!resolved) return c.json({ error: 'Network not configured' }, 400);

  try {
    const sdk = getSdk(resolved);
    const page = await sdk.getDelegations(address as `0x${string}`, cursor);
    const details = await Promise.all(
      page.validatorIds.map((id) => sdk.getDelegator(id, address as `0x${string}`)),
    );

    const items: DelegationItem[] = page.validatorIds.map((id, i) => {
      const d = details[i];
      return {
        validatorId: id.toString(),
        stake: formatMon(d.stake),
        unclaimedRewards: formatMon(d.unclaimedRewards),
        deltaStake: d.deltaStake.toString(),
        nextDeltaStake: d.nextDeltaStake.toString(),
        deltaEpoch: d.deltaEpoch.toString(),
        nextDeltaEpoch: d.nextDeltaEpoch.toString(),
      };
    });

    const response: DelegationsResponse = {
      items,
      cursor: { next: page.nextValId.toString(), done: page.isDone },
    };
    cache.set(cacheKey, response);
    return c.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load delegations';
    return c.json({ error: message }, 500);
  }
});


