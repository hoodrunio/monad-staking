'use client';

import { useMemo, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface ValidatorSelectorOption {
  value: string;
  title: string;
  subtitle?: string;
  description?: string;
  stats?: Array<{ label: string; value: string }>;
  badge?: string;
}

interface ValidatorSelectorProps {
  readonly name?: string;
  readonly options: readonly ValidatorSelectorOption[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly filterPlaceholder?: string;
  readonly emptyMessage?: string;
}

export function ValidatorSelector({
  name,
  options,
  value,
  onChange,
  loading,
  disabled,
  filterPlaceholder = 'Search validators',
  emptyMessage = 'No validators found',
}: ValidatorSelectorProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return options;
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter((option) => {
      const candidate = `${option.title} ${option.subtitle ?? ''} ${option.description ?? ''}`.toLowerCase();
      return candidate.includes(trimmed);
    });
  }, [options, query]);

  return (
    <fieldset className="space-y-3" name={name}>
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={filterPlaceholder}
          disabled={disabled}
          className="w-full rounded-md border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
        />
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-lg border border-slate-800 bg-slate-900/60"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          filtered.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                disabled={disabled}
                className={`w-full rounded-lg border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                  selected
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-100'
                    : 'border-slate-800 bg-slate-950/50 text-slate-100 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{option.title}</p>
                    {option.subtitle && (
                      <p className="text-xs text-slate-400">{option.subtitle}</p>
                    )}
                    {option.description && (
                      <p className="text-xs text-slate-500">{option.description}</p>
                    )}
                    {option.stats && option.stats.length > 0 && (
                      <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-wide text-slate-500">
                        {option.stats.map((stat) => (
                          <span key={stat.label} className="flex items-center gap-1 text-slate-400">
                            <span>{stat.label}:</span>
                            <span className="font-mono text-slate-200">{stat.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {option.badge && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300">
                        {option.badge}
                      </span>
                    )}
                    {selected && (
                      <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </fieldset>
  );
}
