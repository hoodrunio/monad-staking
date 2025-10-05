import { Hono } from 'hono';
import { z } from 'zod';
import { container } from '../../shared/container';

export const priceRoutes = new Hono();

const querySchema = z.object({
  assetId: z.string().optional(),
  vsCurrency: z.string().optional(),
});

priceRoutes.get('/', async (c) => {
  const query = Object.fromEntries(new URL(c.req.url).searchParams);
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  }

  try {
    const useCase = container.getPrice();
    const result = await useCase.execute({
      assetId: parsed.data.assetId,
      vsCurrency: parsed.data.vsCurrency,
    });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch price';
    return c.json({ error: message }, 502);
  }
});
