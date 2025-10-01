import { Hono } from 'hono';
import { z } from 'zod';
import { container } from '../../shared/container';

export const withdrawalsRoutes = new Hono();

const querySchema = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  validatorId: z.coerce.bigint().optional(),
  startId: z.coerce.number().int().min(1).max(255).default(1),
  limit: z.coerce.number().int().positive().max(255).default(64),
  stopAfterMisses: z.coerce.number().int().positive().max(50).default(5),
});

withdrawalsRoutes.get('/', async (c) => {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);

  const { network, address, validatorId, startId, limit, stopAfterMisses } = parsed.data;

  try {
    const useCase = container.listWithdrawals(network);
    const result = await useCase.execute({
      network,
      address: address as `0x${string}`,
      validatorId,
      startId,
      limit,
      stopAfterMisses,
    });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load withdrawals';
    return c.json({ error: message }, 500);
  }
});
