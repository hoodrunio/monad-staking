'use client';

import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import type { ValidatorSummary } from '@/lib/api/models';

interface ValidatorCardProps {
  readonly validator: ValidatorSummary;
  readonly onDelegate: (validator: ValidatorSummary) => void;
  readonly disabled?: boolean;
}

export function ValidatorCard({ validator, onDelegate, disabled }: ValidatorCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-emerald-500/40">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Validator #{validator.validatorId}</p>
            <h3 className="text-lg font-semibold text-slate-100">{validator.meta?.name ?? `Validator ${validator.validatorId}`}</h3>
            {validator.meta?.website && (
              <a
                href={validator.meta.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-300 hover:text-emerald-200"
              >
                {validator.meta.website}
              </a>
            )}
          </div>
          {validator.isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300">
              <CheckBadgeIcon className="h-4 w-4" /> Active
            </span>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Stake" value={validator.stake.formatted} />
          <Stat label="Commission" value={validator.commission.formatted} />
          <Stat label="Rewards" value={validator.unclaimedRewards.formatted} />
          <Stat label="Flags" value={validator.flagsRaw || '—'} mono />
        </dl>
      </div>

      <button
        type="button"
        onClick={() => onDelegate(validator)}
        disabled={disabled}
        className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
      >
        Delegate
      </button>
    </div>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 ${mono ? 'font-mono text-xs text-slate-300' : 'text-slate-100'}`}>{value}</p>
    </div>
  );
}
