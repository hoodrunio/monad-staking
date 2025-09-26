import { cache } from 'react';
import type { MonadNetwork } from '@monad-staking/config';
import { getNetworkConfigMap, tryResolveNetwork } from './networks';
import { apiGet } from './api';
import type { ValidatorListApiResponse } from './api/types';
import { mapValidatorList } from './api/transformers';
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

    const data = await apiGet<ValidatorListApiResponse>('/api/validators', {
      network: networkKey,
      cursor,
      limit: 50,
    });

    const mapped = mapValidatorList(data);

    const validators: ValidatorRow[] = mapped.items.map((item) => ({
      id: item.id,
      authAddress: item.authAddress,
      flags: item.flagsRaw,
      stake: item.stake.formatted,
      commission: item.commission.formatted,
      unclaimedRewards: item.unclaimedRewards.formatted,
    }));

    return {
      networkKey,
      validators,
      currentCursor: cursor,
      nextCursor: mapped.cursor.next,
      prevCursor: mapped.cursor.prev,
      isDone: mapped.isDone,
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
