'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface PaginationControlsProps {
  readonly prevCursor: number | null;
  readonly nextCursor: number | null;
}

export function PaginationControls({
  prevCursor,
  nextCursor,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateCursor = (cursor: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cursor === null || cursor === 0) {
      params.delete('cursor');
    } else {
      params.set('cursor', cursor.toString());
    }

    const query = params.toString();
    const url = (query ? `${pathname}?${query}` : pathname) as Route;
    startTransition(() => {
      router.replace(url);
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
      <div>
        {prevCursor !== null ? `Showing from index ${prevCursor}` : 'Beginning'}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md border border-slate-700 px-3 py-1.5 transition hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
          onClick={() => updateCursor(prevCursor)}
          disabled={prevCursor === null || isPending}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-700 px-3 py-1.5 transition hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
          onClick={() => updateCursor(nextCursor)}
          disabled={nextCursor === null || isPending}
        >
          Next
        </button>
      </div>
    </div>
  );
}
