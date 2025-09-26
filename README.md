# Monad Staking Monorepo

This workspace powers Monad staking experiences with a Bun-based API and shared TypeScript tooling. Packages here are consumed by production services and internal dashboards.

## Workspace Layout
- `apps/staking-api` – Bun + Hono HTTP edge for staking data; relies on the SDK for chain reads and MongoDB and Redis for caching.
- `packages/monad-staking-sdk` – Type-safe viem client targeting the staking precompile (`0x…1000`) and helper flows (delegations, rewards, withdrawals).
- `packages/config` – Runtime configuration loader that validates Monad network settings before the API or SDK instantiate clients.
- **[staking-docs](https://docs.monad.xyz/developer-essentials/staking/)** – Protocol references and implementation notes sourced from Monad documentation.

## Getting Started
1. Install dependencies (pnpm ≥ 8.9, Node ≥ 18.18, Bun ≥ 1.1):
   ```bash
   pnpm install
   ```
2. Configure environment variables using `apps/staking-api/.env.example` as a template. Each enabled network must expose `MONAD_<NETWORK>_CHAIN_ID` and `MONAD_<NETWORK>_RPC_URL` alongside MongoDB credentials.
3. Run the API and worker locally:
   ```bash
   pnpm dev --filter apps/staking-api
   pnpm --filter apps/staking-api run worker
   ```

## Quality Gates
- `pnpm lint` to run ESLint + Prettier rules across the workspace.
- `pnpm build` to compile every package.
- `pnpm --filter apps/staking-api run typecheck` for API-specific TypeScript validation.

## Deployment Notes
- Production hosts should use the systemd (or similar daemon/background processors) units in `apps/staking-api/systemd/` and an external environment file (e.g. `/etc/monad-staking/staking-api.env`).
- The API listens on port 8787 by default (`/health` for probes); the worker polls epoch transitions and refreshes validator data.

## Contributing
- Align protocol logic with **[staking-docs](https://docs.monad.xyz/developer-essentials/staking/)** and document any new assumptions in code reviews.
- Keep shared types inside `packages/` so API and downstream consumers stay in sync.
