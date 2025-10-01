# Staking API Refactoring Implementation Plan

## Goals
- Maintainable, SOLID-compliant architecture
- **Preserve existing API contracts** (endpoints and response types)
- Improve testability through dependency injection
- Clear separation of concerns (domain, application, infrastructure, presentation)

## Architecture Overview

```
src/
├── domain/                    # Business entities & interfaces (ports)
│   ├── validator.ts          # Validator entity + repository interface
│   ├── delegation.ts         # Delegation entity + repository interface  
│   ├── withdrawal.ts         # Withdrawal entity + repository interface
│   ├── epoch.ts              # Epoch entity + repository interface
│   └── types.ts              # Shared domain types
├── application/               # Use cases (business logic orchestration)
│   ├── validators/
│   │   ├── list.ts           # List validators use case
│   │   ├── get-detail.ts     # Get validator detail use case
│   │   └── ingest.ts         # Ingest validators use case
│   ├── delegations/
│   │   └── list.ts           # List delegations use case
│   ├── withdrawals/
│   │   └── list.ts           # List withdrawals use case
│   ├── epoch/
│   │   └── get.ts            # Get epoch info use case
│   └── balance/
│       └── get.ts            # Get balance use case
├── infrastructure/            # External adapters (implements domain interfaces)
│   ├── repositories/
│   │   ├── validator.repo.ts # MongoDB validator repository
│   │   ├── epoch.repo.ts     # MongoDB epoch repository
│   │   └── ingest.repo.ts    # MongoDB ingest state repository
│   ├── blockchain/
│   │   └── sdk.client.ts     # Blockchain SDK wrapper
│   ├── cache/
│   │   └── cache.service.ts  # Redis/memory cache service
│   ├── external/
│   │   └── github.client.ts  # GitHub API client
│   └── db.ts                 # Database connection
├── presentation/              # HTTP layer
│   ├── routes/
│   │   ├── validators.ts     # Thin controller
│   │   ├── delegations.ts    # Thin controller
│   │   ├── withdrawals.ts    # Thin controller
│   │   ├── epoch.ts          # Thin controller
│   │   └── balance.ts        # Thin controller
│   ├── middleware/
│   │   └── rate-limit.ts
│   └── dto.ts                # Request/response DTOs (existing types)
├── shared/
│   ├── container.ts          # Dependency injection container
│   ├── errors.ts             # Domain errors
│   └── types.ts              # Shared types
├── config/
│   └── env.ts                # Environment config (existing)
├── lib/                      # Utilities (existing)
│   ├── cache.ts
│   ├── format.ts
│   └── key-format.ts
├── index.ts                  # HTTP server entry
└── worker.ts                 # Background worker entry
```

## Implementation Phases

### Phase 1: Domain Layer
**Goal**: Define core business entities and repository interfaces

Files to create:
- `src/domain/validator.ts` - Validator entity, ValidatorRepository interface
- `src/domain/delegation.ts` - Delegation types
- `src/domain/withdrawal.ts` - Withdrawal types  
- `src/domain/epoch.ts` - Epoch entity, EpochRepository interface
- `src/domain/types.ts` - Network, Amount, Commission types

Key principles:
- Domain entities are pure TypeScript (no framework dependencies)
- Repository interfaces define contracts (ports)
- No implementation details

### Phase 2: Infrastructure Layer
**Goal**: Implement repository adapters for MongoDB, blockchain, cache

Files to create:
- `src/infrastructure/repositories/validator.repo.ts` - Implements ValidatorRepository
- `src/infrastructure/repositories/epoch.repo.ts` - Implements EpochRepository
- `src/infrastructure/repositories/ingest.repo.ts` - Ingest state management
- `src/infrastructure/blockchain/sdk.client.ts` - Wraps SDK with clean interface
- `src/infrastructure/cache/cache.service.ts` - Cache abstraction
- `src/infrastructure/external/github.client.ts` - Moved from services/

Key principles:
- Repositories translate between domain entities and DB documents
- SDK client provides blockchain access abstraction
- Cache service uses existing lib/cache.ts internally

Files to refactor:
- Move `src/services/github.ts` → `src/infrastructure/external/github.client.ts`
- Keep `src/infra/db.ts`, `src/infra/clients.ts`, `src/infra/logger.ts` (connection management)

### Phase 3: Application Layer
**Goal**: Extract business logic into use cases

Files to create:
- `src/application/validators/list.ts` - ListValidatorsUseCase
- `src/application/validators/get-detail.ts` - GetValidatorDetailUseCase
- `src/application/validators/ingest.ts` - IngestValidatorsUseCase (orchestrates scanning, enriching)
- `src/application/delegations/list.ts` - ListDelegationsUseCase
- `src/application/withdrawals/list.ts` - ListWithdrawalsUseCase
- `src/application/epoch/get.ts` - GetEpochUseCase
- `src/application/balance/get.ts` - GetBalanceUseCase

Key principles:
- Use cases orchestrate domain logic
- Depend only on repository interfaces
- No HTTP concerns (request/response)
- Pure business logic, easy to test

### Phase 4: Dependency Injection
**Goal**: Wire dependencies and refactor routes to thin controllers

Files to create:
- `src/shared/container.ts` - DI container setup
- `src/shared/errors.ts` - Domain-specific errors

Files to refactor:
- `src/presentation/routes/validators.ts` - Use DI container, call use cases
- `src/presentation/routes/delegations.ts` - Use DI container, call use cases
- `src/presentation/routes/withdrawals.ts` - Use DI container, call use cases
- `src/presentation/routes/epoch.ts` - Use DI container, call use cases
- `src/presentation/routes/balance.ts` - Use DI container, call use cases
- `src/presentation/dto.ts` - Extract existing response types

Move routes:
- `src/http/routes/*.ts` → `src/presentation/routes/*.ts`
- `src/http/middleware/*.ts` → `src/presentation/middleware/*.ts`

Key principles:
- Routes are thin (validation → use case → response mapping)
- **Response types remain identical** (backward compatible)
- Error handling centralized

### Phase 5: Worker Refactoring
**Goal**: Refactor worker.ts to use new architecture

Files to refactor:
- `src/worker.ts` - Use IngestValidatorsUseCase, EpochRepository

Key principles:
- Worker orchestrates polling and ingestion
- Delegates to use cases
- No direct DB/SDK access

### Phase 6: Cleanup & Verification
**Goal**: Remove old code, verify endpoints

Files to delete:
- `src/services/ingest.ts` (logic moved to use cases)
- `src/infra/clients.ts` cache logic (moved to infrastructure layer)
- `src/domain/`, `src/infrastructure/`, `src/shared/` old empty folders

Tasks:
- Run type checking: `pnpm typecheck`
- Test all endpoints manually
- Verify response formats unchanged
- Update README if needed

## Breaking Down `ingest.ts` (500+ lines)

### Current Responsibilities:
1. Sequential ID scanning
2. Batch upsert from known IDs
3. Secp key normalization
4. Consensus status updates
5. Metadata enrichment from GitHub
6. Validator metadata parsing

### New Structure:

**Use Case**: `src/application/validators/ingest.ts`
```typescript
class IngestValidatorsUseCase {
  constructor(
    private validatorRepo: ValidatorRepository,
    private ingestRepo: IngestRepository,
    private blockchainClient: BlockchainClient,
    private metadataClient: MetadataClient,
  ) {}
  
  async execute(network: Network): Promise<void> {
    await this.scanAndUpsert(network);
    await this.updateConsensusStatuses(network);
    await this.enrichMetadata(network);
  }
}
```

**Helpers** (private methods or separate services):
- `ValidatorScanner` - Sequential scanning logic
- `MetadataEnricher` - GitHub metadata fetching
- `ConsensusStatusUpdater` - Active validator tracking

## Key Migration Rules

### ✅ MUST Preserve:
- All endpoint paths (`/api/validators`, `/api/delegations`, etc.)
- All query parameter names
- All response field names and types
- All HTTP status codes

### ✅ CAN Change:
- Internal implementation
- File structure
- How dependencies are injected
- How business logic is organized
- Internal type names (not DTOs)

### ✅ Testing Strategy:
1. Before refactor: Document current response formats
2. After each phase: Verify endpoints return same structure
3. Use TypeScript to catch breaking changes
4. Manual smoke tests on each route

## Migration Order

1. ✅ Create IMPLEMENTATION.md
2. Phase 1: Domain layer (entities + interfaces)
3. Phase 2: Infrastructure layer (repositories)
4. Phase 3: Application layer (use cases)
5. Phase 4: DI + refactor routes
6. Phase 5: Refactor worker
7. Phase 6: Cleanup + verification

## Success Criteria

- ✅ All existing endpoints work unchanged
- ✅ Response types match exactly
- ✅ Type checking passes
- ✅ Code is maintainable (SOLID principles applied)
- ✅ Business logic is testable (pure use cases)
- ✅ Dependencies are injected (not global)
- ✅ File naming is simple and clear
