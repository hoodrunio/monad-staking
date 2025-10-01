import { Hono } from 'hono';
import { z } from 'zod';
import { container } from '../../shared/container';

export const delegationsRoutes = new Hono();

const listQuery = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  cursor: z.coerce.bigint().default(0n),
});

delegationsRoutes.get('/', async (c) => {
  const parsed = listQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);

  const { network, address, cursor } = parsed.data;

  try {
    const useCase = container.listDelegations(network);
    const result = await useCase.execute({
      network,
      address: address as `0x${string}`,
      cursor,
    });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load delegations';
    return c.json({ error: message }, 500);
  }
});
