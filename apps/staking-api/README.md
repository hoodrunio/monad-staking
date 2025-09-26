# Staking API

This package exposes a read-only HTTP API and a background worker that keep Monad staking data in sync for the web app. It is built with Bun + Hono, backed by MongoDB, and relies on the shared `@monad-staking/sdk` for on-chain reads.

## Prerequisites

- Bun \>= 1.1
- MongoDB instance (local or remote)
- Redis instance

## Environment variables

Copy `.env.example` to `.env`. Required environment variables as today:

| Variable | Purpose |
| --- | --- |
| `MONAD_TESTNET_2_CHAIN_ID` | Chain id used for Monad testnet-2 RPC requests |
| `MONAD_TESTNET_2_RPC_URL` | HTTPS RPC endpoint for the selected network |
| `MONAD_TESTNET_2_EXPLORER_URL` | Explorer base URL exposed to clients |
| `MONGODB_URI` | Connection string for MongoDB |
| `MONGODB_DB` | Database name to store staking collections |
| `GITHUB_TOKEN` | Token used by ingestion helpers that scrape validator info documentation |

Additional networks can be configured via the shared config package; see **[staking-docs](https://docs.monad.xyz/developer-essentials/staking/)** for the full matrix and update the `MONAD_*` variables accordingly.

## Local development

```bash
# install workspace dependencies
pnpm install

# run the API server in watch mode
cd apps/staking-api
bun run --watch src/index.ts

# in another terminal, run the background worker
bun run src/worker.ts
```

The API listens on `http://localhost:8787` by default and exposes `/health`, `/api/validators`, `/api/delegations`, `/api/withdrawals`, and epoch routes.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev --filter apps/staking-api` | Start server with hot reload via Bun |
| `pnpm --filter apps/staking-api run worker` | Run the polling worker loop |
| `pnpm --filter apps/staking-api run build` | Produce Bun build artifacts in `dist/` |
| `pnpm --filter apps/staking-api run typecheck` | Validate TypeScript types |

## Production deployment

1. Ensure Bun is installed on the target host and the repo is cloned to `/opt/monad-staking` (or adjust paths).
2. Populate an environment file with the variables listed above, e.g. `/etc/monad-staking/staking-api.env`.
3. Copy the systemd units in `apps/staking-api/systemd/` to `/etc/systemd/system/` and tweak `WorkingDirectory`, `User`, `Group`, and `EnvironmentFile`.
4. Reload systemd and enable the services:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now staking-api.service staking-api-worker.service
   ```
5. Inspect logs with `journalctl -u staking-api.service -u staking-api-worker.service`.

The HTTP server surfaces operational metrics via `/health`. The worker automatically ingests validators whenever a new epoch (outside the delay period) is observed.

## Testing

At the moment the package only ships type-level checks. When adding new endpoints or ingestion logic, colocate Vitest specs under `src/**/__tests__` and ensure they run through `pnpm test` (or add a package-level script for consistency).