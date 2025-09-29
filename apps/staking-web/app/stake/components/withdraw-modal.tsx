'use client';

import { useState } from 'react';
import { ActionModal } from './action-modal';
import { Button } from '@/app/components/ui/button';
import type { WithdrawalSummary } from '@/lib/api/models';

interface WithdrawModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly readyWithdrawals: readonly WithdrawalSummary[];
  readonly pendingWithdrawals: readonly WithdrawalSummary[];
  readonly onWithdrawSelected: (withdrawals: WithdrawalSummary[]) => Promise<void>;
  readonly busy: boolean;
}

export function WithdrawModal({
  open,
  onClose,
  readyWithdrawals,
  pendingWithdrawals,
  onWithdrawSelected,
  busy,
}: WithdrawModalProps) {
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<Set<string>>(new Set());

  const handleWithdrawClick = async () => {
    if (selectedWithdrawals.size === 0) return;
    
    const selected = readyWithdrawals.filter((w) =>
      selectedWithdrawals.has(`${w.validatorId}-${w.withdrawalId}`)
    );
    
    await onWithdrawSelected(selected);
    setSelectedWithdrawals(new Set());
  };

  const toggleWithdrawalSelection = (validatorId: string, withdrawalId: number) => {
    const key = `${validatorId}-${withdrawalId}`;
    setSelectedWithdrawals((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedWithdrawals.size === readyWithdrawals.length) {
      // Deselect all
      setSelectedWithdrawals(new Set());
    } else {
      // Select all
      const allKeys = readyWithdrawals.map((w) => `${w.validatorId}-${w.withdrawalId}`);
      setSelectedWithdrawals(new Set(allKeys));
    }
  };

  const handleClose = () => {
    setSelectedWithdrawals(new Set());
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={handleClose}
      title="Withdraw funds"
      description={
        readyWithdrawals.length > 0
          ? `${readyWithdrawals.length} withdrawal${readyWithdrawals.length > 1 ? 's' : ''} ready to withdraw`
          : 'No withdrawals ready yet'
      }
    >
      <div className="space-y-4">
        {readyWithdrawals.length > 0 ? (
          <>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
                <input
                  type="checkbox"
                  checked={selectedWithdrawals.size === readyWithdrawals.length && readyWithdrawals.length > 0}
                  onChange={toggleSelectAll}
                  disabled={busy}
                  className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500/40 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span>Select all ({readyWithdrawals.length})</span>
              </label>
              {selectedWithdrawals.size > 0 && (
                <span className="text-xs text-emerald-200">{selectedWithdrawals.size} selected</span>
              )}
            </div>
            <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
              {readyWithdrawals.map((withdrawal) => {
                const key = `${withdrawal.validatorId}-${withdrawal.withdrawalId}`;
                const isSelected = selectedWithdrawals.has(key);
                return (
                  <label
                    key={key}
                    htmlFor={`withdraw-${key}`}
                    className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      isSelected
                        ? 'border-emerald-400/60 bg-emerald-400/15'
                        : 'border-emerald-300/20 bg-emerald-400/5 hover:border-emerald-300/40 hover:bg-emerald-400/10'
                    } ${busy ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      id={`withdraw-${key}`}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleWithdrawalSelection(withdrawal.validatorId, withdrawal.withdrawalId)}
                      disabled={busy}
                      className="h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500/40 focus:ring-offset-0 disabled:cursor-not-allowed"
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">Validator {withdrawal.validatorId}</p>
                        <span className="text-xs text-emerald-200/60">Slot #{withdrawal.withdrawalId}</span>
                      </div>
                      <p className="text-xs font-medium text-emerald-100">{withdrawal.amount.formatted}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
            No withdrawals are ready yet. Withdrawal requests need to clear the withdrawal delay period first.
          </div>
        )}
        {pendingWithdrawals.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium">Note:</span> You have {pendingWithdrawals.length} pending withdrawal
            {pendingWithdrawals.length > 1 ? 's' : ''} still cooling down.
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={() => void handleWithdrawClick()}
            disabled={busy || selectedWithdrawals.size === 0}
            className="bg-emerald-500 text-slate-900 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-muted-foreground"
          >
            {busy ? 'Processing...' : `Withdraw Selected (${selectedWithdrawals.size})`}
          </Button>
        </div>
      </div>
    </ActionModal>
  );
}
