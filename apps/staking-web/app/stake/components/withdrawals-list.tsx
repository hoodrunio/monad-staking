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
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ready withdrawals</h2>
            <p className="text-sm text-muted-foreground">Slots that have cleared the withdrawal delay.</p>
          </div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{ready.length} ready</span>
        </header>

        {ready.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
            No withdrawals are ready yet.
          </div>
        ) : (
          <div className="space-y-3">
            {ready.map((withdrawal) => (
              <div
                key={`${withdrawal.validatorId}-${withdrawal.withdrawalId}`}
                className="flex flex-col gap-3 rounded-2xl border border-emerald-300/40 bg-emerald-400/10 p-4 text-sm text-foreground md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    Validator {withdrawal.validatorId} · Slot #{withdrawal.withdrawalId}
                  </p>
                  <p className="text-xs text-emerald-100">Amount {withdrawal.amount.formatted}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onWithdraw(withdrawal)}
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted-foreground md:w-auto"
                >
                  {busy ? 'Withdrawing...' : 'Withdraw'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Pending withdrawals</h2>
            <p className="text-sm text-muted-foreground">These slots are still cooling down before funds unlock.</p>
          </div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{pending.length} pending</span>
        </header>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
            No withdrawals pending.
          </div>
        ) : (
          <ul className="space-y-3 text-sm">
            {pending.map((withdrawal) => (
              <li
                key={`${withdrawal.validatorId}-${withdrawal.withdrawalId}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">Validator {withdrawal.validatorId}</p>
                    <p className="text-xs text-muted-foreground">Slot #{withdrawal.withdrawalId}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
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
