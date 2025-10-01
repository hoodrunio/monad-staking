# SDK Improvements

## Changes Made

### 1. Paginated Claim All Rewards  
**Location:** `src/index.ts` - `claimAllRewards()` method

**Problem:** The original implementation only fetched the first page of delegations, missing validators if a delegator had >100 delegations.

**Solution:** 
- Implemented pagination loop to fetch all delegations
- Properly handles `isDone` and `nextValId` pagination parameters

**Before:**
```typescript
const delegations = await this.getDelegations(args.account, 0n);
for (const validatorId of delegations.validatorIds) {
  // claim rewards
}
```

**After:**
```typescript
let startValId = 0n;
let isDone = false;
while (!isDone) {
  const delegations = await this.getDelegations(args.account, startValId);
  isDone = delegations.isDone;
  startValId = delegations.nextValId;
  // claim rewards for all validators in page
}
```

### 2. Activation Epoch Helper  
**Location:** `src/index.ts` - `calculateActivationEpoch()` method

**Problem:** Users needed to manually calculate when their delegation/undelegation would take effect based on epoch boundaries.

**Solution:** Added helper method that returns:
- `activationEpoch`: The epoch when the action takes effect
- `currentEpoch`: Current epoch number
- `inEpochDelayPeriod`: Whether we're past the boundary block
- `reason`: Human-readable explanation

**Usage:**
```typescript
const info = await sdk.calculateActivationEpoch();
console.log(`Your stake will activate in epoch ${info.activationEpoch}`);
console.log(`Reason: ${info.reason}`);
```

### 3. Withdraw Epoch Helper  
**Location:** `src/index.ts` - `calculateWithdrawEpoch()` method

**Problem:** Users needed to manually calculate when undelegated funds would be withdrawable (after withdrawal delay).

**Solution:** Added helper method that returns:
- `withdrawEpoch`: The epoch when funds can be withdrawn
- `currentEpoch`: Current epoch number
- `inEpochDelayPeriod`: Whether we're past the boundary block
- `withdrawalDelay`: Number of epochs to wait
- `reason`: Human-readable explanation with timeline

**Usage:**
```typescript
const info = await sdk.calculateWithdrawEpoch();
console.log(`Your funds will be withdrawable in epoch ${info.withdrawEpoch}`);
console.log(`Reason: ${info.reason}`);
```

### 4. Event Subscription Helpers  
**Location:** `src/index.ts` - `watch*()` and `get*Events()` methods

**Problem:** SDK exposed events in the ABI but provided no helper methods for subscribing or querying them.

**Solution:** Added event support:

**Real-time watching:**
- `watchValidatorCreated()`
- `watchValidatorStatusChanged()`
- `watchDelegate()`
- `watchUndelegate()`
- `watchWithdraw()`
- `watchClaimRewards()`
- `watchCommissionChanged()`

**Historical queries:**
- `getValidatorCreatedEvents()`
- `getDelegateEvents()`
- `getUndelegateEvents()`
- `getWithdrawEvents()`
- `getClaimRewardsEvents()`
- `getCommissionChangedEvents()`

**Usage:**
```typescript
// Watch for new delegations in real-time
const unwatch = sdk.watchDelegate(
  { validatorId: 1n },
  (logs) => console.log('New delegation:', logs)
);

// Query historical events
const events = await sdk.getDelegateEvents({
  validatorId: 1n,
  fromBlock: 1000n,
  toBlock: 2000n
});
```

### 5. Comprehensive Validation Tests  
**Location:** `src/index.test.ts`

**Added test coverage for:**
- Withdrawal ID bounds (0, 1, 255, 256)
- Commission bounds (negative, 0, 1e18, > 1e18)
- Zero amount validation for delegate/undelegate
- Activation epoch calculation (before/during boundary)
- Withdraw epoch calculation (before/during boundary)

**Total tests:** 19 (all passing)

## Breaking Changes

None - all changes are additive.

## Known Issues & Limitations

### `externalReward` ABI Discrepancy
**Issue:** The documentation states that `externalReward` accepts `msg.value` (between 1 MON and 1,000,000 MON), but the ABI marks it as `nonpayable`. 

**Current Implementation:** The SDK follows the ABI as provided and does not include amount validation or value parameter for `externalReward`.

**Recommendation:** Clarify with the Monad team whether:
1. The ABI should be updated to mark `externalReward` as `payable`
2. The documentation should be corrected
3. There's a special mechanism for sending value to nonpayable precompile functions

## Type Safety Improvements

- All event watchers use proper `Log[]` types instead of `any[]`
- Added proper TypeScript imports for viem types
- All validation functions have clear error messages

## Testing

All changes have been validated

## Documentation References

All improvements are based on the official Monad documentation:
- [Staking Behavior](https://docs.monad.xyz/developer-essentials/staking/staking-behavior)
- [Staking Precompile](https://docs.monad.xyz/developer-essentials/staking/staking-precompile)
