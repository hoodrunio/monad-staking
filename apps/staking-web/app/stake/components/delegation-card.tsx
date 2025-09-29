'use client';

import { formatMonFromWei } from '@/lib/utils';
import type { DelegationSummary, ValidatorSummary } from '@/lib/api/models';
import { cn } from '@/lib/utils';

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
  const pendingChange = delegation.deltaStakeRaw === '0' ? '0 MON' : formatMonFromWei(delegation.deltaStakeRaw);
  const nextChange = delegation.nextDeltaStakeRaw === '0' ? '0 MON' : formatMonFromWei(delegation.nextDeltaStakeRaw);

  const validatorName = validator?.meta?.name ?? `Validator ${delegation.validatorId}`;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Validator #{delegation.validatorId}</p>
          <h3 className="text-lg font-semibold text-foreground">{validatorName}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <Stat label="Stake" value={delegation.stake.formatted} />
          <Stat label="Rewards" value={delegation.unclaimedRewards.formatted} highlight />
          <Stat label="Pending change" value={pendingChange} muted />
          <Stat label="Next change" value={nextChange} muted />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <ActionButton
          label={busyAction === 'unstake' ? 'Processing...' : 'Undelegate'}
          tone="amber"
          onClick={() => onUndelegate(delegation)}
          disabled={disabled}
        />
        <ActionButton
          label={busyAction === 'claim' ? 'Claiming...' : 'Claim rewards'}
          tone="emerald"
          onClick={() => onClaim(delegation)}
          disabled={disabled}
        />
        <ActionButton
          label={busyAction === 'compound' ? 'Compounding...' : 'Compound'}
          tone="sky"
          onClick={() => onCompound(delegation)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, muted = false, highlight = false }: { label: string; value: string; muted?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-1', muted ? 'font-mono text-xs text-muted-foreground' : 'text-foreground', highlight && 'text-primary')}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({ label, onClick, disabled, tone }: { label: string; onClick: () => void; disabled?: boolean; tone: 'emerald' | 'amber' | 'sky' }) {
  const toneStyles: Record<typeof tone, string> = {
    emerald: 'border-emerald-300/50 bg-emerald-400/15 text-emerald-100 hover:border-emerald-300',
    amber: 'border-amber-300/50 bg-amber-400/15 text-amber-100 hover:border-amber-300',
    sky: 'border-sky-300/50 bg-sky-400/15 text-sky-100 hover:border-sky-300',
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-muted-foreground',
        toneStyles[tone],
      )}
    >
      {label}
    </button>
  );
}
