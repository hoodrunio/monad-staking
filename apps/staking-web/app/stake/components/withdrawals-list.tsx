'use client';

import type { WithdrawalSummary } from '@/lib/api/models';

interface WithdrawalsListProps {
  readonly ready: readonly WithdrawalSummary[];
  readonly pending: readonly WithdrawalSummary[];
  readonly onWithdraw: (withdrawal: WithdrawalSummary) => void;
  readonly busy?: boolean;
}

export function WithdrawalsList({ ready, pending, onWithdraw, busy }: WithdrawalsListProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Ready withdrawals</h2>
            <p className="text-sm text-slate-500">Claim slots that have completed the waiting period.</p>
          </div>
          <span className="text-xs uppercase tracking-wide text-slate-500">{ready.length} ready</span>
        </header>

        {ready.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
            No withdrawals are ready yet.
          </div>
        ) : (
          <div className="space-y-3">
            {ready.map((withdrawal) => (
              <div
                key={`${withdrawal.validatorId}-${withdrawal.withdrawalId}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-100"
              >
                <div>
                  <p className="font-semibold">
                    Validator {withdrawal.validatorId} · Slot #{withdrawal.withdrawalId}
                  </p>
                  <p className="text-xs text-emerald-300">Amount {withdrawal.amount.formatted}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onWithdraw(withdrawal)}
                  disabled={busy}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  {busy ? 'Withdrawing…' : 'Withdraw'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Pending withdrawals</h2>
            <p className="text-sm text-slate-500">These become available after the waiting period.</p>
          </div>
          <span className="text-xs uppercase tracking-wide text-slate-500">{pending.length} pending</span>
        </header>
        {pending.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
            No withdrawals pending.
          </div>
        ) : (
          <ul className="space-y-2 text-sm text-slate-300">
            {pending.map((withdrawal) => (
              <li key={`${withdrawal.validatorId}-${withdrawal.withdrawalId}`} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-200">Validator {withdrawal.validatorId}</p>
                    <p className="text-xs text-slate-500">Slot #{withdrawal.withdrawalId}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>Amount {withdrawal.amount.formatted}</p>
                    <p>Unlock epoch {withdrawal.withdrawEpoch}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
