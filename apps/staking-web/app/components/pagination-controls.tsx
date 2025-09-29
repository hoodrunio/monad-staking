'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface PaginationControlsProps {
  readonly prevCursor: string | null;
  readonly nextCursor: string | null;
}

export function PaginationControls({ prevCursor, nextCursor }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateCursor = (cursor: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cursor === null || cursor === '') {
      params.delete('cursor');
    } else {
      params.set('cursor', cursor);
    }

    const query = params.toString();
    const url = (query ? `${pathname}?${query}` : pathname) as Route;
    startTransition(() => {
      router.replace(url);
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="font-mono text-xs">
        {prevCursor ? `Cursor ${prevCursor}` : 'Beginning of result set'}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-xl px-4 py-2 font-medium text-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => updateCursor(prevCursor)}
          disabled={prevCursor === null || isPending}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-xl px-4 py-2 font-medium text-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => updateCursor(nextCursor)}
          disabled={nextCursor === null || isPending}
        >
          Next
        </button>
      </div>
    </div>
  );
}
