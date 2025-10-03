'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import { ExplorerLink } from './explorer-link';
import { formatShortAddress } from '@/lib/validators-utils';
import { SparklePixelIcon, ChainBreakPixelIcon } from '@/app/components/icons';

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
      <div className="rounded-3xl p-6 text-sm text-muted-foreground">
        No validators found for this view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden border-2 border-border bg-secondary/40 shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
      <table className="min-w-full text-sm">
        <thead className="bg-secondary/70 font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            <th className="px-5 py-4 text-left">Validator</th>
            <th className="px-5 py-4 text-left">Auth Address</th>
            <th className="px-5 py-4 text-left">Commission</th>
            <th className="px-5 py-4 text-left">Stake</th>
            <th className="px-5 py-4 text-left">Unclaimed Rewards</th>
            <th className="px-5 py-4 text-left">Flags</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-border bg-card/60 text-foreground">
          {validators.map((validator) => (
            <tr key={validator.id} className="transition-colors hover:bg-secondary/30">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={{ pathname: `/validators/${validator.id}`, query: { network: currentNetwork } }}
                    className="font-mono text-xs text-primary hover:text-accent"
                  >
                    #{validator.id}
                  </Link>
                  <span className="inline-flex items-center gap-1 border-2 border-border px-2 py-1 font-display text-[9px] uppercase tracking-[0.14em]">
                    {validator.isActive ? (
                      <SparklePixelIcon size={12} className="text-primary" />
                    ) : (
                      <ChainBreakPixelIcon size={12} className="text-accent" />
                    )}
                    {validator.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 font-mono text-xs">
                <ExplorerLink
                  config={networkConfig}
                  type="address"
                  value={validator.authAddress}
                  className="text-muted-foreground hover:text-primary"
                >
                  {formatShortAddress(validator.authAddress)}
                </ExplorerLink>
              </td>
              <td className="px-5 py-4 font-display text-xs uppercase tracking-[0.12em] text-primary">{validator.commission}</td>
              <td className="px-5 py-4 font-mono text-xs text-foreground">{validator.stake}</td>
              <td className="px-5 py-4 font-mono text-xs text-accent">{validator.unclaimedRewards}</td>
              <td className="px-5 py-4 font-mono text-[10px] text-muted-foreground">{validator.flagsRaw || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
