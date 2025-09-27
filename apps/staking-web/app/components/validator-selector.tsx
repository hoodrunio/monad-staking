'use client';

import { useMemo, useState } from 'react';
import { CheckCircleIcon, MagnifyingGlassCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/cn';

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
  readonly hasMore?: boolean;
  readonly onLoadMore?: () => void;
  readonly loadingMore?: boolean;
  readonly toolbar?: React.ReactNode;
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
  hasMore,
  onLoadMore,
  loadingMore,
  toolbar,
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
    <fieldset className="space-y-4" name={name}>
      <div className="relative">
        <MagnifyingGlassCircleIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={filterPlaceholder}
          disabled={disabled}
          className="w-full rounded-xl border border-white/10 bg-white/10 pl-11 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {toolbar ? <div className="flex items-center justify-between text-xs text-muted-foreground">{toolbar}</div> : null}

      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
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
                className={cn(
                  'w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0',
                  selected
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-white/10 bg-white/5 text-foreground hover:border-primary/30',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{option.title}</p>
                    {option.subtitle ? <p className="text-xs text-muted-foreground">{option.subtitle}</p> : null}
                    {option.description ? <p className="text-xs text-muted-foreground">{option.description}</p> : null}
                    {option.stats && option.stats.length > 0 ? (
                      <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {option.stats.map((stat) => (
                          <span key={stat.label} className="flex items-center gap-1">
                            <span>{stat.label}:</span>
                            <span className="font-mono text-foreground">{stat.value}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {option.badge ? (
                      <span className="rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary-foreground">
                        {option.badge}
                      </span>
                    ) : null}
                    {selected ? <CheckCircleSolid className="h-5 w-5 text-primary" /> : <CheckCircleIcon className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {hasMore ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore || disabled}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load more validators'}
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}
