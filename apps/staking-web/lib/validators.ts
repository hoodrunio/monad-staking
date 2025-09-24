import { cache } from 'react';
import type { MonadNetwork } from '@monad-staking/config';
import { getNetworkConfigMap, tryResolveNetwork } from './networks';
import { getStakingSdk } from './clients';
import { formatBigInt, formatCommission, formatMon, truncateAddress } from './format';

export type ValidatorSetView = 'execution' | 'consensus' | 'snapshot';

const VIEW_LABELS: Record<ValidatorSetView, string> = {
  execution: 'Execution',
  consensus: 'Consensus',
  snapshot: 'Snapshot',
};

const VIEW_METHOD: Record<
  ValidatorSetView,
  (sdk: ReturnType<typeof getStakingSdk>, startIndex: number) => Promise<{
    isDone: boolean;
    nextIndex: number;
    validatorIds: readonly bigint[];
  }>
> = {
  execution: async (sdk, startIndex) =>
    sdk.getExecutionValidatorSet(startIndex),
  consensus: async (sdk, startIndex) =>
    sdk.getConsensusValidatorSet(startIndex),
  snapshot: async (sdk, startIndex) =>
    sdk.getSnapshotValidatorSet(startIndex),
};

export interface ValidatorRow {
  readonly id: string;
  readonly authAddress?: string;
  readonly flags?: string;
  readonly stake?: string;
  readonly consensusStake?: string;
  readonly snapshotStake?: string;
  readonly commission?: string;
  readonly unclaimedRewards?: string;
  readonly error?: string;
}

export interface ValidatorSetPage {
  readonly networkKey: MonadNetwork;
  readonly view: ValidatorSetView;
  readonly validators: readonly ValidatorRow[];
  readonly currentCursor: number;
  readonly nextCursor: number | null;
  readonly prevCursor: number | null;
  readonly isDone: boolean;
}

export const getValidatorSetPage = cache(
  async (
    networkKey: MonadNetwork,
    view: ValidatorSetView,
    startIndex = 0,
  ): Promise<ValidatorSetPage> => {
    const configMap = getNetworkConfigMap();
    const resolved = tryResolveNetwork(configMap, networkKey);
    if (!resolved) {
      throw new Error('Network is not fully configured.');
    }

    const sdk = getStakingSdk(resolved);
    const method = VIEW_METHOD[view];

    const { isDone, nextIndex, validatorIds } = await method(
      sdk,
      Math.max(0, startIndex),
    );

    const details = await Promise.allSettled(
      validatorIds.map((id) => sdk.getValidator(id)),
    );

    const validators: ValidatorRow[] = validatorIds.map((id, idx) => {
      const detail = details[idx];
      if (detail.status === 'fulfilled') {
        const info = detail.value;
        return {
          id: id.toString(),
          authAddress: info.authAddress,
          flags: formatBigInt(info.flags),
          stake: formatMon(info.stake),
          consensusStake: formatMon(info.consensusStake),
          snapshotStake: formatMon(info.snapshotStake),
          commission: formatCommission(info.commission),
          unclaimedRewards: formatMon(info.unclaimedRewards),
        };
      }

      return {
        id: id.toString(),
        error:
          detail.reason instanceof Error
            ? detail.reason.message
            : 'Unknown error retrieving validator.',
      };
    });

    const count = validatorIds.length;
    const prevCursor = startIndex > 0 ? Math.max(0, startIndex - count) : null;
    const finalizedNext = isDone ? null : nextIndex;

    return {
      networkKey,
      view,
      validators,
      currentCursor: startIndex,
      nextCursor: finalizedNext,
      prevCursor,
      isDone,
    };
  },
);

export function getValidatorViewLabel(view: ValidatorSetView): string {
  return VIEW_LABELS[view];
}

export function resolveViewParam(param: string | undefined): ValidatorSetView {
  if (param === 'consensus' || param === 'snapshot') {
    return param;
  }
  return 'execution';
}

export function formatValidatorRow(row: ValidatorRow) {
  return {
    ...row,
    authAddressShort: row.authAddress
      ? truncateAddress(row.authAddress)
      : undefined,
  };
}

export { parseNetworkKey } from './networks';
