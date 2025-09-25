# Monad Staking dApp Monorepo

This repository hosts a production-focused workspace for building a fast, secure staking experience on Monad across mainnet and testnets. It couples the official staking documentation with typed tooling and a Next.js dashboard so contributors can ship validator and delegator workflows with confidence.

## Project Structure
- `apps/staking-web`: Next.js 14 application that renders the staking dashboard and, soon, interactive delegation flows.
- `packages/config`: Runtime-safe network configuration loader that validates required environment variables per Monad network.
- `packages/monad-staking-sdk`: Typed viem-based client for the staking precompile at `0x0000000000000000000000000000000000001000`, including guardrails around commissions, withdrawal IDs, and reward bounds.
- `(staking-docs)[https://docs.monad.xyz/developer-essentials/staking/]`: Canonical references for staking behavior and precompile semantics.

## Getting Started
1. Install dependencies (pnpm ≥ 8.9, Node ≥ 18.18):
   ```bash
   pnpm install
   ```
2. Copy `.env.example` (to be added) or set environment variables directly. Each enabled network requires `MONAD_<NETWORK>_CHAIN_ID` and `MONAD_<NETWORK>_RPC_URL`, e.g.:
   ```bash
   export MONAD_TESTNET_1_CHAIN_ID=10143
   export MONAD_TESTNET_1_RPC_URL=https://rpc.testnet1.yourprovider.com
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
- Reference staking constants and epoch semantics from `(staking-docs)[https://docs.monad.xyz/developer-essentials/staking/]` when implementing business logic, and document any protocol assumptions in code reviews.