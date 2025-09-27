'use client';

import { useMemo } from 'react';
import { useWithdrawalsQuery } from '@/lib/queries';
import { getNextAvailableWithdrawId } from '@/lib/utils';
import type { MonadNetwork } from '@monad-staking/config';

interface WithdrawIdPickerProps {
  network: MonadNetwork;
  address: string | undefined;
  validatorId: string;
  value: number;
  onChange: (id: number) => void;
  disabled?: boolean;
}

export function WithdrawIdPicker({ network, address, validatorId, value, onChange, disabled }: WithdrawIdPickerProps) {
  const { data: withdrawals, isLoading } = useWithdrawalsQuery(network, address || '', validatorId);

  const usedIds = useMemo(() => withdrawals?.items.map((entry) => entry.withdrawalId) || [], [withdrawals]);
  const suggestedId = useMemo(() => getNextAvailableWithdrawId(usedIds), [usedIds]);

  const handleSuggestedClick = () => {
    if (suggestedId !== null) {
      onChange(suggestedId);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="255"
          value={value}
          onChange={(event) => onChange(parseInt(event.target.value, 10) || 1)}
          disabled={disabled}
          className="block w-24 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
        />
        {!isLoading && suggestedId !== null && suggestedId !== value ? (
          <button
            type="button"
            onClick={handleSuggestedClick}
            disabled={disabled}
            className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40"
          >
            Use next available ({suggestedId})
          </button>
        ) : null}
      </div>

      {usedIds.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Used IDs for this validator: {usedIds.sort((a, b) => a - b).join(', ')}
        </p>
      ) : null}

      {usedIds.includes(value) ? (
        <p className="text-xs text-amber-200">
          Warning: ID {value} is already used for this validator.
        </p>
      ) : null}
    </div>
  );
}
