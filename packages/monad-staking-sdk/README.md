# @monad-staking/sdk

TypeScript SDK for interacting with Monad's native staking precompile at `0x0000000000000000000000000000000000001000`.

## Features

-  **Type-safe** - Full TypeScript support with comprehensive type definitions
-  **Modular** - Clean separation of concerns with specialized client classes
-  **Well-tested** - Comprehensive test coverage
-  **Viem-based** - Built on top of viem for robust blockchain interactions
-  **Event support** - Real-time event watching and historical queries
-  **Epoch helpers** - Utilities for calculating activation and withdrawal epochs

## Installation

```bash
pnpm add @monad-staking/sdk @monad-staking/config viem
```

## Quick Start

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { createMonadStakingSdk } from '@monad-staking/sdk';
import { loadMonadNetworks, requireNetworkConfig } from '@monad-staking/config';

// Load network configuration
const configs = loadMonadNetworks();
const network = requireNetworkConfig(configs, 'monad-testnet-1');

// Create clients
const publicClient = createPublicClient({
  chain: { id: network.chainId, name: network.label },
  transport: http(network.rpcUrl),
});

const walletClient = createWalletClient({
  chain: { id: network.chainId, name: network.label },
  transport: http(network.rpcUrl),
  account: '0x...',
});

// Initialize SDK
const sdk = createMonadStakingSdk({
  network,
  publicClient,
  walletClient,
});

// Use the SDK
const epoch = await sdk.getEpoch();
const validator = await sdk.getValidator(1n);
```

## Architecture

The SDK uses a modular architecture with specialized clients:

### Read Operations (ReadClient)
All view/query operations - no wallet required:
- `getEpoch()` - Current epoch information
- `getValidator()` - Validator details
- `getDelegator()` - Delegator information
- `getConsensusValidatorSet()` - Active validators
- `calculateActivationEpoch()` - When stake activates
- `calculateWithdrawEpoch()` - When withdrawals are available

### Write Operations (WriteClient)
All state-changing transactions - requires wallet:
- `delegate()` - Stake to a validator
- `undelegate()` - Undelegate stake
- `withdraw()` - Withdraw undelegated funds
- `compound()` - Compound rewards
- `claimRewards()` - Claim rewards
- `claimAllRewards()` - Claim from all validators
- `changeCommission()` - Update validator commission

### Event Operations (EventClient)
Real-time watching and historical queries:
- `watchDelegate()` - Watch delegation events
- `getDelegateEvents()` - Query historical delegations
- Similar methods for all staking events

## Usage Examples

### Delegating Stake

```typescript
const hash = await sdk.delegate({
  validatorId: 1n,
  amount: parseEther('100'), // 100 MON
  account: walletClient.account.address,
});

const receipt = await sdk.waitForTransactionReceipt(hash);
```

### Checking Activation Time

```typescript
const info = await sdk.calculateActivationEpoch();
console.log(`Stake activates in epoch ${info.activationEpoch}`);
console.log(`Reason: ${info.reason}`);
```

### Undelegating and Withdrawing

```typescript
// Step 1: Undelegate
const undelegateHash = await sdk.undelegate({
  validatorId: 1n,
  amount: parseEther('50'),
  withdrawalId: 1, // Must be 1-255
  account: walletClient.account.address,
});

// Step 2: Wait for withdrawal period
const withdrawInfo = await sdk.calculateWithdrawEpoch();
console.log(`Funds withdrawable in epoch ${withdrawInfo.withdrawEpoch}`);

// Step 3: Withdraw when ready
const withdrawHash = await sdk.withdraw({
  validatorId: 1n,
  withdrawalId: 1,
  account: walletClient.account.address,
});
```

### Claiming Rewards

```typescript
// Claim from specific validator
await sdk.claimRewards({
  validatorId: 1n,
  account: walletClient.account.address,
});

// Or claim from all validators
const hashes = await sdk.claimAllRewards({
  account: walletClient.account.address,
});
```

### Watching Events

```typescript
// Watch for new delegations
const unwatch = sdk.watchDelegate(
  { validatorId: 1n },
  (logs) => {
    logs.forEach(log => {
      console.log('New delegation:', log);
    });
  }
);

// Query historical events
const events = await sdk.getDelegateEvents({
  validatorId: 1n,
  fromBlock: 1000n,
  toBlock: 2000n,
});
```

### Querying Validator Sets

```typescript
// Get consensus validators (paginated)
let startIndex = 0;
let isDone = false;

while (!isDone) {
  const result = await sdk.getConsensusValidatorSet(startIndex);
  isDone = result.isDone;
  startIndex = result.nextIndex;
  
  for (const validatorId of result.validatorIds) {
    const validator = await sdk.getValidator(validatorId);
    console.log(validator);
  }
}
```

## API Reference

### Types

```typescript
import type {
  EpochInfo,
  ValidatorInfo,
  DelegatorInfo,
  PaginatedValidatorSet,
  ActivationEpochInfo,
  WithdrawEpochInfo,
} from '@monad-staking/sdk';
```

### Constants

- Withdrawal IDs must be between 1-255
- Commission is expressed in 1e18 units (10% = 1e17)
- Withdrawal delay is 1 epoch after stake deactivation
- Epochs are ~50,000 blocks on mainnet

## Project Structure

```
src/
├── index.ts              # Public API exports
├── sdk.ts                # Main SDK facade
├── abi.ts                # Staking precompile ABI
│
├── types/                # Type definitions
├── validation/           # Input validation
├── utils/                # Helper utilities
└── client/               # Specialized clients
    ├── base-client.ts    # Shared functionality
    ├── read-client.ts    # View operations
    ├── write-client.ts   # Transactions
    └── event-client.ts   # Event handling
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build
pnpm build
```

## Documentation

- [Monad Staking Docs](https://docs.monad.xyz/developer-essentials/staking) - Official staking documentation

## License
MIT License - see [LICENSE](./LICENSE) for details.