'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

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
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-monad-grid opacity-50" />
      <CardHeader className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-3">
          <CardTitle className="text-2xl">Your staking summary</CardTitle>
          <CardDescription className="text-base">
            Keep tabs on your staked MON, cumulative rewards, and withdrawal pipeline across validators.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStake}
            disabled={stakeDisabled}
            className="rounded-xl border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-muted-foreground"
          >
            Stake MON
          </button>
          <button
            type="button"
            onClick={onClaimAll}
            disabled={!canClaim || claiming}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted-foreground"
          >
            {claiming ? 'Claiming rewards...' : 'Claim all rewards'}
          </button>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat label="Total staked" value={`${formatter.format(totals.staked)} MON`} />
          <SummaryStat label="Rewards" value={`${formatter.format(totals.rewards)} MON`} highlight />
          <SummaryStat label="Pending withdraw" value={`${formatter.format(totals.pendingWithdraw)} MON`} />
          <SummaryStat label="Ready to claim" value={`${formatter.format(totals.readyWithdraw)} MON`} />
        </dl>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-3 text-xl font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
