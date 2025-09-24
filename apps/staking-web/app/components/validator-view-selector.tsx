'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { ValidatorSetView } from '@/lib/validators';
import { getValidatorViewLabel } from '@/lib/validators';

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
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              isActive
                ? 'bg-emerald-600 text-white shadow shadow-emerald-900/40'
                : 'border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100'
            }`}
          >
            {getValidatorViewLabel(view)}
          </button>
        );
      })}
    </div>
  );
}
