'use client';

interface PortfolioSummaryProps {
  readonly totals: {
    staked: number;
    rewards: number;
    pendingWithdraw: number;
    readyWithdraw: number;
  };
  readonly onClaimAll: () => void;
  readonly onStake: () => void;
  readonly claiming: boolean;
  readonly canClaim: boolean;
  readonly stakeDisabled?: boolean;
}

export function PortfolioSummary({ totals, onClaimAll, onStake, claiming, canClaim, stakeDisabled }: PortfolioSummaryProps) {
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/70 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-400">Portfolio</p>
          <h2 className="text-xl font-semibold text-slate-100">Your staking summary</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onStake}
            disabled={stakeDisabled}
            className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-400"
          >
            Stake
          </button>
          <button
            type="button"
            onClick={onClaimAll}
            disabled={!canClaim || claiming}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {claiming ? 'Claiming rewards…' : 'Claim all rewards'}
          </button>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <SummaryStat label="Total staked" value={`${formatter.format(totals.staked)} MON`} />
        <SummaryStat label="Rewards" value={`${formatter.format(totals.rewards)} MON`} highlight />
        <SummaryStat label="Pending withdraw" value={`${formatter.format(totals.pendingWithdraw)} MON`} />
        <SummaryStat label="Ready to claim" value={`${formatter.format(totals.readyWithdraw)} MON`} />
      </dl>
    </div>
  );
}

function SummaryStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${highlight ? 'text-emerald-300' : 'text-slate-100'}`}>{value}</p>
    </div>
  );
}
