'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/app/components/ui/button';
import { CoinPixelIcon, HourglassPixelIcon } from '@/app/components/icons';

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
    <div className="flex flex-col gap-4 border-2 border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground shadow-[4px_4px_0_rgba(0,0,0,0.45)] sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.12em]">
        <CoinPixelIcon size={12} className="text-primary" />
        {prevCursor ? `Cursor ${prevCursor}` : 'Beginning of result set'}
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => updateCursor(prevCursor)}
          disabled={prevCursor === null || isPending}
          className="inline-flex items-center gap-2"
        >
          <HourglassPixelIcon size={12} className="text-primary" />
          Previous
        </Button>
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={() => updateCursor(nextCursor)}
          disabled={nextCursor === null || isPending}
          className="inline-flex items-center gap-2"
        >
          Next
          <CoinPixelIcon size={12} className="text-primary-foreground" />
        </Button>
      </div>
    </div>
  );
}
