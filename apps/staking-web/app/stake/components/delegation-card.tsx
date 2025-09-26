'use client';

import { formatMonFromWei } from '@/lib/utils';
import type { DelegationSummary, ValidatorSummary } from '@/lib/api/models';

interface DelegationCardProps {
  readonly delegation: DelegationSummary;
  readonly validator?: ValidatorSummary;
  readonly onClaim: (delegation: DelegationSummary) => void;
  readonly onCompound: (delegation: DelegationSummary) => void;
  readonly onUndelegate: (delegation: DelegationSummary) => void;
  readonly busyAction?: string | null;
  readonly disabled?: boolean;
}

export function DelegationCard({ delegation, validator, onClaim, onCompound, onUndelegate, busyAction, disabled }: DelegationCardProps) {
  const pendingChange = delegation.deltaStakeRaw === '0'
    ? '0 MON'
    : formatMonFromWei(delegation.deltaStakeRaw);
  const nextChange = delegation.nextDeltaStakeRaw === '0'
    ? '0 MON'
    : formatMonFromWei(delegation.nextDeltaStakeRaw);

  const validatorName = validator?.meta?.name ?? `Validator ${delegation.validatorId}`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Validator #{delegation.validatorId}</p>
          <h3 className="text-lg font-semibold text-slate-100">{validatorName}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <Stat label="Stake" value={delegation.stake.formatted} />
          <Stat label="Rewards" value={delegation.unclaimedRewards.formatted} />
          <Stat label="Pending change" value={pendingChange} muted />
          <Stat label="Next change" value={nextChange} muted />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onUndelegate(delegation)}
          disabled={disabled}
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200 hover:border-amber-500 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800"
        >
          {busyAction === 'unstake' ? 'Processing…' : 'Undelegate'}
        </button>
        <button
          type="button"
          onClick={() => onClaim(delegation)}
          disabled={disabled}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 hover:border-emerald-500 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800"
        >
          {busyAction === 'claim' ? 'Claiming…' : 'Claim rewards'}
        </button>
        <button
          type="button"
          onClick={() => onCompound(delegation)}
          disabled={disabled}
          className="rounded-md border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-200 hover:border-sky-500 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800"
        >
          {busyAction === 'compound' ? 'Compounding…' : 'Compound'}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 ${muted ? 'font-mono text-xs text-slate-400' : 'text-slate-100'}`}>{value}</p>
    </div>
  );
}
