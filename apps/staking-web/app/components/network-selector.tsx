'use client';

import { useTransition } from 'react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { MonadNetworkConfig } from '@monad-staking/config';

interface NetworkSelectorProps {
  readonly networks: readonly MonadNetworkConfig[];
  readonly selectedKey: string | null;
}

export function NetworkSelector({ networks, selectedKey }: NetworkSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const value = event.target.value;
    if (value) {
      params.set('network', value);
    } else {
      params.delete('network');
    }

    startTransition(() => {
      const nextUrl = `${pathname}?${params.toString()}` as Route;
      router.replace(nextUrl);
    });
  };

  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">Network</span>
      <select
        className="rounded-xl px-4 py-2 text-sm font-medium text-foreground bg-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        value={selectedKey ?? ''}
        onChange={handleChange}
        disabled={isPending}
      >
        {networks.map((network) => (
          <option key={network.key} value={network.key}>
            {network.label}
          </option>
        ))}
      </select>
    </label>
  );
}
