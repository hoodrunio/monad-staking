import { Hono } from 'hono';
import { z } from 'zod';
import { container } from '../../shared/container';
import { normalizeSecpKey, normalizeHexNo0x } from '../../lib/key-format';

export const validatorRoutes = new Hono();

const listQuery = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  cursor: z.string().default(''),
  limit: z.coerce.number().int().positive().max(500).default(100),
  active: z.enum(['true', 'false']).optional(),
});

const detailQuery = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
});

function isDecimalId(input: string): boolean {
  return /^\d+$/.test(input);
}

function detectAddressHex(input: string): string | null {
  const normalized = normalizeHexNo0x(input);
  return normalized && normalized.length === 40 ? normalized : null;
}

validatorRoutes.get('/', async (c) => {
  const parsed = listQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);

  const { network, cursor, limit, active } = parsed.data;
  const activeOnly = active === 'true';

  try {
    const result = await container.listValidators.execute({
      network,
      cursor: cursor || undefined,
      limit,
      activeOnly,
    });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load validators';
    return c.json({ error: message }, 500);
  }
});

validatorRoutes.get('/:id', async (c) => {
  const url = new URL(c.req.url);
  const network = url.searchParams.get('network') ?? '';
  const idParam = c.req.param('id');
  const parsed = detailQuery.safeParse({ network });
  if (!parsed.success) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid params', details: parsed.error.flatten() } }, 400);
  }

  const net = parsed.data.network;
  let idBig: bigint | null = null;
  let secp: string | null = null;
  let auth: string | null = null;

  if (isDecimalId(idParam)) {
    idBig = BigInt(idParam);
  } else {
    const secpParam = url.searchParams.get('secp');
    const authParam = url.searchParams.get('auth');
    secp = secpParam ? normalizeSecpKey(secpParam) : null;
    auth = authParam ? normalizeHexNo0x(authParam) : detectAddressHex(idParam);
    if (!secp && !auth) {
      const maybeHex = normalizeSecpKey(idParam) ?? normalizeHexNo0x(idParam);
      if (maybeHex && maybeHex.length >= 40) secp = maybeHex;
    }
    if (!secp && !auth) {
      return c.json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Provide a numeric validator id, or a valid secp/auth address (?secp=... or ?auth=0x...)',
        },
      }, 400);
    }
  }

  try {
    const useCase = container.getValidatorDetail(net);
    const result = await useCase.execute({
      network: net,
      id: idBig ?? undefined,
      secp: secp ?? undefined,
      authAddress: auth ?? undefined,
    });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch validator';
    if (message.includes('not found')) {
      return c.json({ error: { code: 'NOT_FOUND', message } }, 404);
    }
    return c.json({ error: { code: 'INTERNAL_ERROR', message } }, 500);
  }
});
