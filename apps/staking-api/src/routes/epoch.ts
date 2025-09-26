import { Hono } from 'hono';
import { z } from 'zod';
import { getResolvedNetworks, getSdk } from '../clients';
import { createHybridCache } from '../cache';

export const epochRoutes = new Hono();

const querySchema = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
});

type EpochResponse = {
  epoch: string;
  inEpochDelayPeriod: boolean;
  epochLength: number;
  epochDelayPeriod: number;
  withdrawalDelay: number;
};

const cache = createHybridCache<EpochResponse>({ prefix: 'epoch', ttlSeconds: 10 });

epochRoutes.get('/', async (c) => {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) {
    return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  }

  const { network } = parsed.data;
  const cacheKey = `epoch:${network}`;
  const cached = await cache.get(cacheKey);
  if (cached) return c.json(cached);

  const resolved = getResolvedNetworks()[network];
  if (!resolved) return c.json({ error: 'Network not configured' }, 400);

  try {
    const sdk = getSdk(resolved);
    const info = await sdk.getEpoch();
    const response: EpochResponse = {
      epoch: info.epoch.toString(),
      inEpochDelayPeriod: info.inEpochDelayPeriod,
      epochLength: resolved.epochLength,
      epochDelayPeriod: resolved.epochDelayPeriod,
      withdrawalDelay: resolved.withdrawalDelay,
    };
    await cache.set(cacheKey, response);
    return c.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch epoch';
    return c.json({ error: message }, 500);
  }
});

