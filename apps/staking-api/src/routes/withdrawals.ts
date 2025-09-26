import { Hono } from 'hono';
import { z } from 'zod';
import pLimit from 'p-limit';
import { getResolvedNetworks, getSdk } from '../clients';
import { TtlCache } from '../cache';
import { normalizeAmount, type AmountField } from '../format';

export const withdrawalsRoutes = new Hono();

const querySchema = z.object({
  network: z.enum(['monad-mainnet', 'monad-testnet-1', 'monad-testnet-2']),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  validatorId: z.coerce.bigint().optional(),
  startId: z.coerce.number().int().min(1).max(255).default(1),
  limit: z.coerce.number().int().positive().max(255).default(64),
  stopAfterMisses: z.coerce.number().int().positive().max(50).default(5),
});

type WithdrawalItem = {
  validatorId: string;
  withdrawalId: number;
  amount: AmountField;
  accRewardPerToken: AmountField;
  withdrawEpoch: string;
};

type WithdrawalResponse = {
  items: WithdrawalItem[];
  nextStartId: number | null;
};

const cache = new TtlCache<WithdrawalResponse>(20_000);

withdrawalsRoutes.get('/', async (c) => {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400);
  const { network, address, validatorId, startId, limit, stopAfterMisses } = parsed.data;

  const cacheKey = `withdrawals:${network}:${address}:${validatorId ?? 'all'}:${startId}:${limit}:${stopAfterMisses}`;
  const cached = cache.get(cacheKey);
  if (cached) return c.json(cached);

  const resolved = getResolvedNetworks()[network];
  if (!resolved) return c.json({ error: 'Network not configured' }, 400);
  const sdk = getSdk(resolved);

  async function scanValidator(valId: bigint): Promise<WithdrawalItem[]> {
    const items: WithdrawalItem[] = [];
    let misses = 0;
    let count = 0;
    for (let wid = startId; wid <= 255; wid++) {
      if (count >= limit || misses >= stopAfterMisses) break;
      try {
        const req = await sdk.getWithdrawalRequest(
          valId,
          address as `0x${string}`,
          wid,
        );
        const has = req.withdrawalAmount > 0n;
        if (has) {
          items.push({
            validatorId: valId.toString(),
            withdrawalId: wid,
            amount: normalizeAmount(req.withdrawalAmount),
            accRewardPerToken: normalizeAmount(req.accRewardPerToken),
            withdrawEpoch: req.withdrawEpoch.toString(),
          });
          count++;
          misses = 0;
        } else {
          misses++;
        }
      } catch {
        // treat as miss (not present)
        misses++;
      }
    }
    return items;
  }

  try {
    let validatorIds: bigint[] = [];
    if (validatorId) {
      validatorIds = [validatorId];
    } else {
      // Discover delegations first page only to bound cost; UI can call per validator for deeper scans
      const delPage = await sdk.getDelegations(address as `0x${string}`, 0n);
      validatorIds = delPage.validatorIds as bigint[];
    }

    const limiter = pLimit(6);
    const results = await Promise.all(
      validatorIds.map((vid) => limiter(() => scanValidator(vid))),
    );
    const items = results.flat();
    // Compute nextStartId suggestion
    const nextStartId = items.length >= limit ? startId + limit : null;
    const response: WithdrawalResponse = { items, nextStartId };
    cache.set(cacheKey, response);
    return c.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load withdrawals';
    return c.json({ error: message }, 500);
  }
});

