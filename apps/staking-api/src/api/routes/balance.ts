import { Hono } from 'hono';
import { z } from 'zod';
import { container } from '../../shared/container';

export const balanceRoutes = new Hono();

const querySchema = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

balanceRoutes.get('/', async (c) => {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) {
    return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  }

  const { network, address } = parsed.data;

  try {
    const useCase = container.getBalance(network);
    const result = await useCase.execute({
      network,
      address: address as `0x${string}`,
    });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch balance';
    return c.json({ error: message }, 500);
  }
});
