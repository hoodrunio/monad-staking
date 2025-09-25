import { Hono } from 'hono';
import { validatorRoutes } from './routes/validators';
import { epochRoutes } from './routes/epoch';
import { delegationsRoutes } from './routes/delegations';
import { withdrawalsRoutes } from './routes/withdrawals';

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true }));

app.route('/api/epoch', epochRoutes);
app.route('/api/validators', validatorRoutes);
app.route('/api/delegations', delegationsRoutes);
app.route('/api/withdrawals', withdrawalsRoutes);

const port = Number(process.env.PORT ?? 8787);
console.log(`[staking-api] starting on :${port}`);

export default {
  port,
  fetch: app.fetch,
};


