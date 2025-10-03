'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChainBreakPixelIcon,
  ChestPixelIcon,
  CoinPixelIcon,
  SparklePixelIcon,
} from '@/app/components/icons';

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
        <SparklePixelIcon className="pointer-events-none absolute left-3 top-2.5 text-primary" size={14} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={filterPlaceholder}
          disabled={disabled}
          className="w-full border-2 border-border bg-secondary/40 pl-10 pr-3 py-2 font-display text-xs uppercase tracking-[0.12em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {toolbar ? <div className="flex items-center justify-between text-sm tracking-[0.08em] text-muted-foreground">{toolbar}</div> : null}

      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse border-2 border-border bg-secondary/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-2 border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
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
                  'w-full border-2 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0',
                  selected
                    ? 'border-primary bg-secondary/50 text-foreground'
                    : 'border-border bg-secondary/30 text-foreground hover:border-primary/70 hover:bg-secondary/40',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-display text-sm uppercase tracking-[0.12em] text-primary">{option.title}</p>
                    {option.subtitle ? <p className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground">{option.subtitle}</p> : null}
                    {option.description ? <p className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground">{option.description}</p> : null}
                    {option.stats && option.stats.length > 0 ? (
                      <div className="flex flex-wrap gap-3 font-display text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                        {option.stats.map((stat) => (
                          <span key={stat.label} className="inline-flex items-center gap-1">
                            <CoinPixelIcon size={10} className="text-primary" />
                            <span>{stat.label}:</span>
                            <span className="font-mono text-foreground">{stat.value}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {option.badge ? (
                      <span className="inline-flex items-center gap-1 border-2 border-primary px-2 py-0.5 font-display text-[9px] uppercase tracking-[0.14em] text-primary">
                        <ChestPixelIcon size={10} className="text-primary" />
                        {option.badge}
                      </span>
                    ) : null}
                    {selected ? (
                      <span className="inline-flex items-center gap-1 border-2 border-primary px-2 py-0.5 font-display text-[9px] uppercase tracking-[0.14em] text-primary">
                        <SparklePixelIcon size={10} className="text-primary" />
                        Selected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 border-2 border-border px-2 py-0.5 font-display text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                        <ChainBreakPixelIcon size={10} className="text-muted-foreground" />
                        Choose
                      </span>
                    )}
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
            className="w-full border-2 border-border px-3 py-2 font-display text-xs uppercase tracking-[0.12em] text-foreground transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load more validators'}
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}
