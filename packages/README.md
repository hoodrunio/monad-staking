# Packages

Shared libraries that power Monad staking services. Each package is published within the workspace and designed to stay framework-agnostic.

## `@monad-staking/config`
- Validates Monad network settings at runtime and surfaces typed configuration objects.
- Requires `MONAD_<NETWORK>_CHAIN_ID`, `MONAD_<NETWORK>_RPC_URL`, and optional explorer URLs per network.
- Consumers: `apps/staking-api`, `@monad-staking/sdk`, worker scripts.

## `@monad-staking/sdk`
- Thin viem-based client for the staking precompile (`0x000…1000`).
- Offers higher-level helpers for delegations, withdrawals, rewards, and epoch data, returning type-safe results.
- Designed to run in Bun/Node environments; supply a viem `publicClient` when instantiating.

### Usage
```ts
import { createMonadStakingSdk } from '@monad-staking/sdk';
import { getResolvedNetworks } from '@monad-staking/config';

const config = getResolvedNetworks()['monad-testnet-2'];
const sdk = createMonadStakingSdk({ network: config, publicClient });
const epoch = await sdk.getEpoch();
```

Keep additions documented here so API and downstream consumers understand the shared surface area.
