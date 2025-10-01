import pLimit from 'p-limit';
import type { ValidatorRepository } from '../../domain/validator';
import type { IngestRepository } from '../../domain/ingest';
import type { BlockchainClient } from '../../infrastructure/blockchain/sdk.client';
import type { GithubClient, NetworkFolder } from '../../infrastructure/external/github.client';
import type { Network } from '../../domain/types';
import { logger } from '../../infrastructure';
import { normalizeSecpKey } from '../../lib/key-format';
import { ingestConfig } from '../../config/env';

const MISS_THRESHOLD = Math.max(1, ingestConfig.missThreshold);
const SCAN_BATCH_SIZE = Math.max(1, ingestConfig.batchSize);
const RESUME_LOOKBACK = ingestConfig.resumeLookback;

export class IngestValidatorsUseCase {
  constructor(
    private validatorRepo: ValidatorRepository,
    private ingestRepo: IngestRepository,
    private blockchainClient: BlockchainClient,
    private githubClient: GithubClient,
  ) {}

  async execute(network: Network): Promise<void> {
    logger.info('ingest.start', { network });

    const knownIds = await this.discoverKnownValidators();
    if (knownIds.size > 0) {
      await this.upsertKnownValidators(network, knownIds);
    }

    await this.normalizeStoredKeys(network);
    const scanStats = await this.scanSequentialIds(network, knownIds);
    logger.info('ingest.scan.complete', { network, ...scanStats });

    await this.updateConsensusStatuses(network);
    await this.enrichMetadata(network);
  }

  private async discoverKnownValidators(): Promise<Set<bigint>> {
    const discovered = new Set<bigint>();

    let cursor = 0;
    for (let i = 0; i < 1000; i++) {
      const page = await this.blockchainClient.getExecutionValidatorSet(cursor);
      for (const id of page.validatorIds) discovered.add(id);
      if (page.isDone) break;
      cursor = page.nextIndex;
    }

    cursor = 0;
    for (let i = 0; i < 1000; i++) {
      const page = await this.blockchainClient.getSnapshotValidatorSet(cursor);
      for (const id of page.validatorIds) discovered.add(id);
      if (page.isDone) break;
      cursor = page.nextIndex;
    }

    return discovered;
  }

  private async upsertKnownValidators(network: Network, ids: Set<bigint>): Promise<void> {
    const limiter = pLimit(8);
    await Promise.all(
      Array.from(ids).map((id) =>
        limiter(async () => {
          try {
            const v = await this.blockchainClient.getValidator(id);
            const empty = v.stake === 0n && v.consensusStake === 0n && v.snapshotStake === 0n;
            if (empty) return;

            const secp = normalizeSecpKey(v.secpPubkey);
            await this.validatorRepo.save({
              id,
              network,
              authAddress: v.authAddress,
              commission: v.commission,
              stake: {
                execution: v.stake,
                consensus: v.consensusStake,
                snapshot: v.snapshotStake,
              },
              unclaimedRewards: v.unclaimedRewards,
              flags: v.flags,
              keys: {
                secpPubkey: secp ?? undefined,
                blsPubkey: v.blsPubkey,
              },
              updatedAt: new Date(),
            });
          } catch (error) {
            logger.warn('ingest.seed.failed', {
              network,
              validatorId: id.toString(),
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }),
      ),
    );
  }

  private async normalizeStoredKeys(network: Network): Promise<void> {
    try {
      const count = await this.validatorRepo.normalizeSecpKeys(network);
      if (count > 0) {
        logger.info('ingest.secp.normalized', { network, count });
      }
    } catch (error) {
      logger.warn('ingest.secp.normalization_failed', {
        network,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async scanSequentialIds(network: Network, knownIds: Set<bigint>) {
    const state = await this.ingestRepo.get(network);
    const resumePointer = state ? state.nextValidatorId : 0n;
    const startFrom = resumePointer > RESUME_LOOKBACK ? resumePointer - RESUME_LOOKBACK : 0n;

    let cursor = startFrom;
    let highWater = resumePointer > startFrom ? resumePointer : startFrom;
    let misses = 0;
    let scanned = 0;
    let created = 0;
    let updated = 0;
    let batches = 0;

    while (misses < MISS_THRESHOLD) {
      const ids: bigint[] = [];
      for (let i = 0; i < SCAN_BATCH_SIZE; i++) {
        ids.push(cursor + BigInt(i));
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const validator = await this.blockchainClient.getValidator(id);
            return { id, validator } as const;
          } catch (error) {
            return { id, error } as const;
          }
        }),
      );

      batches++;

      for (const result of results) {
        highWater = result.id + 1n;
        scanned++;

        if ('error' in result) {
          misses++;
          continue;
        }

        const { validator } = result;
        const empty = validator.stake === 0n && validator.consensusStake === 0n && validator.snapshotStake === 0n;
        if (empty) {
          misses++;
          continue;
        }

        misses = 0;
        const secp = normalizeSecpKey(validator.secpPubkey);

        const existing = await this.validatorRepo.findById(network, result.id);
        const isNew = !existing;

        await this.validatorRepo.save({
          id: result.id,
          network,
          authAddress: validator.authAddress,
          commission: validator.commission,
          stake: {
            execution: validator.stake,
            consensus: validator.consensusStake,
            snapshot: validator.snapshotStake,
          },
          unclaimedRewards: validator.unclaimedRewards,
          flags: validator.flags,
          keys: {
            secpPubkey: secp ?? undefined,
            blsPubkey: validator.blsPubkey,
          },
          updatedAt: new Date(),
        });

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        knownIds.add(result.id);
      }

      await this.ingestRepo.save({
        network,
        nextValidatorId: highWater,
        updatedAt: new Date(),
      });

      cursor = highWater;
      if (misses >= MISS_THRESHOLD) break;
    }

    return { scanned, created, updated, batches, misses, nextValidatorId: highWater.toString() };
  }

  private async updateConsensusStatuses(network: Network): Promise<void> {
    try {
      let cursor = 0;
      const activeIds: bigint[] = [];
      for (let i = 0; i < 1000; i++) {
        const page = await this.blockchainClient.getConsensusValidatorSet(cursor);
        activeIds.push(...page.validatorIds);
        if (page.isDone) break;
        cursor = page.nextIndex;
      }

      await this.validatorRepo.updateConsensusStatus(network, activeIds);
      logger.info('ingest.consensus.updated', { network, activeCount: activeIds.length });
    } catch (error) {
      logger.warn('ingest.consensus.failed', {
        network,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async enrichMetadata(network: Network): Promise<void> {
    try {
      const folder = this.mapNetworkFolder(network);
      const files = await this.githubClient.listValidatorInfo(folder);
      let enriched = 0;

      for (const file of files) {
        try {
          const meta = await this.extractValidatorMetadata(file);
          if (!meta) continue;

          const count = await this.validatorRepo.updateMetadata(network, meta.secp, meta.data);
          if (count > 0) enriched += count;
        } catch (error) {
          logger.warn('ingest.metadata.file_failed', {
            network,
            path: file.path,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info('ingest.metadata.complete', { network, files: files.length, enriched });
    } catch (error) {
      logger.warn('ingest.metadata.skipped', {
        network,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async extractValidatorMetadata(file: { name: string; url: string; downloadUrl?: string; path: string; sha: string }) {
    const metaObj = await this.githubClient.fetchValidatorJson(file.url);
    let secp: string | undefined;
    let name: string | undefined;
    let website: string | undefined;
    let description: string | undefined;
    let logo: string | undefined;
    let contacts: Record<string, string> | undefined;

    if (metaObj && typeof metaObj === 'object') {
      const obj = metaObj as Record<string, unknown>;
      const secpCandidate = this.extractString(obj, ['secpPubkey', 'secp_pubkey', 'secpPublicKey']);
      secp = secpCandidate ? normalizeSecpKey(secpCandidate) ?? undefined : undefined;
      name = this.extractString(obj, ['name']);
      website = this.extractString(obj, ['website']);
      description = this.extractString(obj, ['description']);
      logo = this.extractString(obj, ['logo']);
      contacts = this.extractRecord(obj, ['contacts']);
    }

    if (!secp) {
      const fromName = this.extractCompressedSecpFromName(file.name);
      if (fromName) secp = fromName;
    }

    if (!secp && file.downloadUrl) {
      const res = await fetch(file.downloadUrl);
      if (res.ok) {
        const text = await res.text();
        const fromText = this.extractCompressedSecpFromText(text);
        if (fromText) secp = fromText;
      }
    }

    if (!secp) return null;

    return {
      secp,
      data: {
        name,
        website,
        description,
        logoUrl: logo,
        contacts,
        githubPath: file.path,
        githubSha: file.sha,
      },
    };
  }

  private mapNetworkFolder(network: Network): NetworkFolder {
    if (network === 'monad-mainnet') return 'mainnet';
    if (network === 'monad-testnet-2') return 'testnet-2';
    return 'testnet';
  }

  private extractString(obj: Record<string, unknown>, keys: readonly string[]): string | undefined {
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'string') return value;
    }
    return undefined;
  }

  private extractRecord(obj: Record<string, unknown>, keys: readonly string[]): Record<string, string> | undefined {
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        const input = value as Record<string, unknown>;
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(input)) {
          if (typeof v === 'string') out[k] = v;
        }
        return out;
      }
    }
    return undefined;
  }

  private extractCompressedSecpFromName(filename: string): string | undefined {
    const base = filename.includes('.') ? filename.slice(0, filename.indexOf('.')) : filename;
    if (base.length === 66 && (base.startsWith('02') || base.startsWith('03'))) {
      return base.toLowerCase();
    }
    return undefined;
  }

  private extractCompressedSecpFromText(text: string): string | undefined {
    const match = text.match(/\b(02|03)[0-9a-fA-F]{64}\b/);
    return match ? match[0].toLowerCase() : undefined;
  }
}
