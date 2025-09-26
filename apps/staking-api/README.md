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
| `REDIS_URL` | Redis connection string powering rate limiting and response caching (defaults to `redis://localhost:6379`) |
| `RATE_LIMIT` | Requests allowed per window for public APIs (default `180`) |
| `RATE_LIMIT_WINDOW` | Sliding window length in seconds (default `60`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowlist in addition to the bundled defaults |
| `EPOCH_POLL_MS` | Base polling cadence for epoch watcher (default `30000`) |
| `EPOCH_POLL_MIN_MS` | Minimum sleep between polls when backoff applies (default `5000`) |
| `EPOCH_POLL_MAX_MS` | Upper bound for exponential backoff (default `300000`) |
| `INGEST_MAX_RETRIES` | How many times the worker retries per epoch before giving up |
| `INGEST_MISS_THRESHOLD` | Consecutive empty validator ids before scan stops (default `8`) |
| `INGEST_BATCH_SIZE` | Number of validator ids fetched per batch (default `32`) |
| `INGEST_RESUME_LOOKBACK` | BigInt window to rewind when resuming scans (default `256`) |
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
| `pnpm docker:staking-api` | Build the production container image |

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

### Docker Compose (local/staging)

If you prefer container orchestration, the root `docker-compose.yml` defines both services:

```bash
cp apps/staking-api/.env.example apps/staking-api/.env  # adjust secrets before running
docker compose up --build
```

This spins up `staking-api` (port `8787`) and `staking-worker` from the same image, with the worker overriding the default command to execute `dist/worker.js`.

The HTTP server surfaces operational metrics via `/health` and Prometheus-formatted metrics under `/metrics`. The worker automatically ingests validators whenever a new epoch (outside the delay period) is observed.

### Container image

For containerized deployments, a multi-stage `Dockerfile` is available in `apps/staking-api/`. The image bundles both the HTTP server (`dist/index.js`) and the worker (`dist/worker.js`). Build and run locally with:

```bash
pnpm docker:staking-api
docker run --rm -p 8787:8787 --env-file /path/to/staking-api.env staking-api:latest
```

Override the default command to launch the worker instead of the HTTP server:

```bash
docker run --rm --env-file /path/to/staking-api.env staking-api:latest run apps/staking-api/dist/worker.js
```

## Testing

At the moment the package only ships type-level checks. When adding new endpoints or ingestion logic, colocate Vitest specs under `src/**/__tests__` and ensure they run through `pnpm test` (or add a package-level script for consistency).
