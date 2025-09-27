'use client';

import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import type { ValidatorSummary } from '@/lib/api/models';
import { cn } from '@/lib/cn';

interface ValidatorCardProps {
  readonly validator: ValidatorSummary;
  readonly onDelegate: (validator: ValidatorSummary) => void;
  readonly disabled?: boolean;
}

export function ValidatorCard({ validator, onDelegate, disabled }: ValidatorCardProps) {
  return (
    <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-primary/50">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Validator #{validator.validatorId}</p>
            <h3 className="text-lg font-semibold text-foreground">{validator.meta?.name ?? `Validator ${validator.validatorId}`}</h3>
            {validator.meta?.website && (
              <a
                href={validator.meta.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:text-primary/80"
              >
                {validator.meta.website}
              </a>
            )}
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] uppercase tracking-wide',
              validator.isActive
                ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100'
                : 'border-amber-400/50 bg-amber-400/10 text-amber-100',
            )}
          >
            <CheckBadgeIcon className="h-4 w-4" />
            {validator.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Stake" value={validator.stake.formatted} />
          <Stat label="Commission" value={validator.commission.formatted} />
          <Stat label="Rewards" value={validator.unclaimedRewards.formatted} highlight />
          <Stat label="Flags" value={validator.flagsRaw || 'None'} mono />
        </dl>
      </div>

      <button
        type="button"
        onClick={() => onDelegate(validator)}
        disabled={disabled}
        className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted-foreground"
      >
        Delegate
      </button>
    </div>
  );
}

function Stat({ label, value, mono = false, highlight = false }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1',
          mono ? 'font-mono text-xs text-muted-foreground' : 'text-foreground',
          highlight && 'text-primary',
        )}
      >
        {value}
      </p>
    </div>
  );
}
