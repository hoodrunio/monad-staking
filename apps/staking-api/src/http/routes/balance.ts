import { Hono } from 'hono';
import { z } from 'zod';
import { getResolvedNetworks, getSdk } from '../../infra/clients';
import { createHybridCache } from '../../lib/cache';
import { normalizeAmount, type AmountField } from '../../lib/format';
import { getPublicClient } from '../../infra/clients';

export const balanceRoutes = new Hono();

const querySchema = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

type BalanceResponse = {
  available: AmountField;
  staked: AmountField;
};

const cache = createHybridCache<BalanceResponse>({ prefix: 'balance', ttlSeconds: 10 });

balanceRoutes.get('/', async (c) => {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) {
    return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  }

  const { network, address } = parsed.data;
  const cacheKey = `balance:${network}:${address}`;
  const cached = await cache.get(cacheKey);
  if (cached) return c.json(cached);

  const resolved = getResolvedNetworks()[network];
  if (!resolved) return c.json({ error: 'Network not configured' }, 400);

  try {
    const publicClient = getPublicClient(resolved);
    const sdk = getSdk(resolved);

    // Get wallet balance (available)
    const walletBalance = await publicClient.getBalance({ address: address as `0x${string}` });

    // Get total delegated amount
    const delegations = await sdk.getDelegations(address as `0x${string}`, 0n);
    let totalDelegated = 0n;

    if (delegations.validatorIds.length > 0) {
      for (const validatorId of delegations.validatorIds) {
        const delegator = await sdk.getDelegator(validatorId, address as `0x${string}`);
        totalDelegated += delegator.stake;
      }
    }

    const response: BalanceResponse = {
      available: normalizeAmount(walletBalance),
      staked: normalizeAmount(totalDelegated),
    };
    await cache.set(cacheKey, response);
    return c.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch balance';
    return c.json({ error: message }, 500);
  }
});
