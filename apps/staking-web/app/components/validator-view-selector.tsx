'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { ValidatorSetView } from '@/lib/validators';
import { getValidatorViewLabel } from '@/lib/validators';
import { cn } from '@/lib/utils';

const VIEWS: ValidatorSetView[] = ['execution', 'consensus', 'snapshot'];

interface ValidatorViewSelectorProps {
  readonly selected: ValidatorSetView;
}

export function ValidatorViewSelector({ selected }: ValidatorViewSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateView = (view: ValidatorSetView) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    params.delete('cursor');

    const query = params.toString();
    const url = (query ? `${pathname}?${query}` : pathname) as Route;
    startTransition(() => {
      router.replace(url);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {VIEWS.map((view) => {
        const isActive = view === selected;
        return (
          <button
            key={view}
            type="button"
            onClick={() => updateView(view)}
            disabled={isPending}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
              isActive
                ? 'border-primary/40 bg-primary/15 text-primary-foreground shadow-glow'
                : 'border-white/10 bg-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary',
            )}
          >
            {getValidatorViewLabel(view)}
          </button>
        );
      })}
    </div>
  );
}
