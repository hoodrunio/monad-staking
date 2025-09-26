import { cache } from 'react';
import type { MonadNetwork } from '@monad-staking/config';
import { getNetworkConfigMap, tryResolveNetwork } from './networks';
import { apiGet } from './api';
import { truncateAddress } from './format';

export type ValidatorSetView = 'execution' | 'consensus' | 'snapshot';

const VIEW_LABELS: Record<ValidatorSetView, string> = {
  execution: 'Execution',
  consensus: 'Consensus',
  snapshot: 'Snapshot',
};

// view retained for URL/state but list uses API/db

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
  readonly validators: readonly ValidatorRow[];
  readonly currentCursor: string;
  readonly nextCursor: string | null;
  readonly prevCursor: string | null;
  readonly isDone: boolean;
}

export const getValidatorSetPage = cache(
  async (
    networkKey: MonadNetwork,
    _view: ValidatorSetView,
    cursor = '',
  ): Promise<ValidatorSetPage> => {
    const configMap = getNetworkConfigMap();
    const resolved = tryResolveNetwork(configMap, networkKey);
    if (!resolved) {
      throw new Error('Network is not fully configured.');
    }

    const data = await apiGet<{
      items: Array<{
        validatorId: string;
        authAddress: string;
        commission: string;
        stake: { execution: string; consensus: string; snapshot: string };
        unclaimedRewards: string;
        flagsRaw: string;
      }>;
      cursor: { next: string | null; prev: string | null };
      isDone: boolean;
    }>('/api/validators', { network: networkKey, cursor, limit: 50 });

    const validators: ValidatorRow[] = data.items.map((item) => ({
      id: item.validatorId,
      authAddress: item.authAddress,
      flags: item.flagsRaw,
      stake: item.stake.execution,
      consensusStake: item.stake.consensus,
      snapshotStake: item.stake.snapshot,
      commission: item.commission,
      unclaimedRewards: item.unclaimedRewards,
    }));

    return {
      networkKey,
      validators,
      currentCursor: cursor,
      nextCursor: data.cursor.next,
      prevCursor: data.cursor.prev,
      isDone: data.isDone,
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
