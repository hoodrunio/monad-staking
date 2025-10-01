import { Hono } from 'hono';
import { z } from 'zod';
import { container } from '../../shared/container';

export const epochRoutes = new Hono();

const querySchema = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
});

epochRoutes.get('/', async (c) => {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) {
    return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  }

  const { network } = parsed.data;
  const networkConfig = container.getNetworkConfig(network);
  if (!networkConfig) return c.json({ error: 'Network not configured' }, 400);

  try {
    const useCase = container.getEpoch(network);
    const result = await useCase.execute({ network, networkConfig });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch epoch';
    return c.json({ error: message }, 500);
  }
});
