# Monad Staking dApp Monorepo

This repository hosts a production-focused workspace for building a fast, secure staking experience on Monad across mainnet and testnets. It couples the official staking documentation (see `staking-docs/`) with typed tooling and a Next.js dashboard so contributors can ship validator and delegator workflows with confidence.

## Project Structure
- `apps/staking-web`: Next.js 14 application that renders the staking dashboard and, soon, interactive delegation flows.
- `packages/config`: Runtime-safe network configuration loader that validates required environment variables per Monad network.
- `packages/monad-staking-sdk`: Typed viem-based client for the staking precompile at `0x0000000000000000000000000000000000001000`, including guardrails around commissions, withdrawal IDs, and reward bounds.
- `staking-docs/`: Canonical references for staking behavior and precompile semantics.

## Getting Started
1. Install dependencies (pnpm ≥ 8.9, Node ≥ 18.18):
   ```bash
   pnpm install
   ```
2. Copy `.env.example` (to be added) or set environment variables directly. Each enabled network requires `MONAD_<NETWORK>_CHAIN_ID` and `MONAD_<NETWORK>_RPC_URL`, e.g.:
   ```bash
   export MONAD_TESTNET_1_CHAIN_ID=17000
   export MONAD_TESTNET_1_RPC_URL=https://rpc.testnet1.yourprovider.io
   ```
3. Launch the staking web app:
   ```bash
   pnpm dev --filter @monad-staking/staking-web
   ```
4. Run checks before every PR:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```

## Development Notes
- The SDK and web app share viem clients via `apps/staking-web/lib/clients.ts`; use these helpers when adding new data hooks or transaction flows.
- TailwindCSS drives the design system. Extend tokens in `tailwind.config.ts` and global styles in `app/globals.css`.
- React Query (planned) should back any long-lived RPC polling so we respect Monad epoch timing without overwhelming providers.

## Contributing
- Follow the conventions in `AGENTS.md` for coding style, testing expectations, and review etiquette.
- Prefer incremental, production-ready changes—avoid placeholder data or TODO scaffolding.
- Reference staking constants and epoch semantics from `staking-docs/` when implementing business logic, and document any protocol assumptions in code reviews.

## Roadmap Highlights
- Validator explorer with consensus/execution snapshots.
- Wallet integration for delegation, compounding, and withdrawals.
- Automated monitoring and analytics around boundary blocks, commissions, and validator health.
