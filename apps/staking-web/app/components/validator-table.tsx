'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import { ExplorerLink } from './explorer-link';
import { formatShortAddress } from '@/lib/validators-utils';
import { cn } from '@/lib/utils';

interface ValidatorTableRow {
  id: string;
  authAddress: string;
  commission: string;
  stake: string;
  unclaimedRewards: string;
  flagsRaw: string;
  isActive?: boolean;
}

interface ValidatorTableProps {
  readonly validators: readonly ValidatorTableRow[];
  readonly networkConfig: ResolvedMonadNetworkConfig;
}

export function ValidatorTable({ validators, networkConfig }: ValidatorTableProps) {
  const searchParams = useSearchParams();
  const currentNetwork = searchParams.get('network') || networkConfig.key;

  if (validators.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
        No validators found for this view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_35px_60px_-45px_rgba(56,189,248,0.55)]">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/10 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-4 text-left font-semibold">Validator</th>
            <th className="px-5 py-4 text-left font-semibold">Auth Address</th>
            <th className="px-5 py-4 text-left font-semibold">Commission</th>
            <th className="px-5 py-4 text-left font-semibold">Stake</th>
            <th className="px-5 py-4 text-left font-semibold">Unclaimed Rewards</th>
            <th className="px-5 py-4 text-left font-semibold">Flags</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-foreground">
          {validators.map((validator) => (
            <tr key={validator.id} className="transition-colors hover:bg-white/10">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={{ pathname: `/validators/${validator.id}`, query: { network: currentNetwork } }}
                    className="font-mono text-xs text-primary hover:text-primary/80"
                  >
                    {validator.id}
                  </Link>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      validator.isActive
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-amber-400/40 bg-amber-500/10 text-amber-200',
                    )}
                  >
                    {validator.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                <ExplorerLink config={networkConfig} type="address" value={validator.authAddress} className="hover:text-primary">
                  {formatShortAddress(validator.authAddress)}
                </ExplorerLink>
              </td>
              <td className="px-5 py-4 text-sm text-foreground/90">{validator.commission}</td>
              <td className="px-5 py-4 text-sm text-foreground/90">{validator.stake}</td>
              <td className="px-5 py-4 text-sm text-foreground/90">{validator.unclaimedRewards}</td>
              <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{validator.flagsRaw}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
