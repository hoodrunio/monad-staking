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

export function WithdrawIdPicker({ 
  network, 
  address, 
  validatorId, 
  value, 
  onChange, 
  disabled 
}: WithdrawIdPickerProps) {
  const { data: withdrawals, isLoading } = useWithdrawalsQuery(
    network, 
    address || '', 
    validatorId
  );

  const usedIds = useMemo(() => {
    return withdrawals?.items.map(w => w.withdrawalId) || [];
  }, [withdrawals]);

  const suggestedId = useMemo(() => {
    return getNextAvailableWithdrawId(usedIds);
  }, [usedIds]);

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
          onChange={(e) => onChange(parseInt(e.target.value) || 1)}
          disabled={disabled}
          className="block w-24 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
        />
        {!isLoading && suggestedId !== null && suggestedId !== value && (
          <button
            type="button"
            onClick={handleSuggestedClick}
            disabled={disabled}
            className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
          >
            Use next available ({suggestedId})
          </button>
        )}
      </div>
      
      {usedIds.length > 0 && (
        <p className="text-xs text-slate-400">
          Used IDs for this validator: {usedIds.sort((a, b) => a - b).join(', ')}
        </p>
      )}
      
      {usedIds.includes(value) && (
        <p className="text-xs text-amber-400">
          ⚠️ ID {value} is already used for this validator
        </p>
      )}
    </div>
  );
}
