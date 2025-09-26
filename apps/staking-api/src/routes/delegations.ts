import { Hono } from 'hono';
import { z } from 'zod';
import { getResolvedNetworks, getSdk } from '../clients';
import { createHybridCache } from '../cache';
import { normalizeAmount, type AmountField } from '../format';

export const delegationsRoutes = new Hono();

const listQuery = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  cursor: z.coerce.bigint().default(0n),
});

type DelegationItem = {
  validatorId: string;
  stake: AmountField;
  unclaimedRewards: AmountField;
  deltaStake: AmountField;
  nextDeltaStake: AmountField;
  deltaEpoch: string;
  nextDeltaEpoch: string;
};

type DelegationsResponse = {
  items: DelegationItem[];
  cursor: { next: string; done: boolean };
};

const cache = createHybridCache<DelegationsResponse>({ prefix: 'delegations', ttlSeconds: 20 });

delegationsRoutes.get('/', async (c) => {
  const parsed = listQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  const { network, address, cursor } = parsed.data;

  const cacheKey = `delegations:${network}:${address}:${cursor.toString()}`;
  const cached = await cache.get(cacheKey);
  if (cached) return c.json(cached);

  const resolved = getResolvedNetworks()[network];
  if (!resolved) return c.json({ error: 'Network not configured' }, 400);

  try {
    const sdk = getSdk(resolved);
    const page = await sdk.getDelegations(address as `0x${string}`, cursor);
    const details = await Promise.all(
      page.validatorIds.map((id) => sdk.getDelegator(id, address as `0x${string}`)),
    );

    const items: DelegationItem[] = page.validatorIds.map((id: bigint, i: number) => {
      const d = details[i];
      return {
        validatorId: id.toString(),
        stake: normalizeAmount(d.stake),
        unclaimedRewards: normalizeAmount(d.unclaimedRewards),
        deltaStake: normalizeAmount(d.deltaStake),
        nextDeltaStake: normalizeAmount(d.nextDeltaStake),
        deltaEpoch: d.deltaEpoch.toString(),
        nextDeltaEpoch: d.nextDeltaEpoch.toString(),
      };
    });

    const response: DelegationsResponse = {
      items,
      cursor: { next: page.nextValId.toString(), done: page.isDone },
    };
    await cache.set(cacheKey, response);
    return c.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load delegations';
    return c.json({ error: message }, 500);
  }
});
