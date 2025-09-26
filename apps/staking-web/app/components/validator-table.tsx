'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import { ExplorerLink } from './explorer-link';
import { formatShortAddress } from '@/lib/validators-utils';

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
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
        No validators found for this view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 shadow shadow-black/10">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead className="bg-slate-900/50 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Validator ID</th>
            <th className="px-4 py-3 text-left font-semibold">Auth Address</th>
            <th className="px-4 py-3 text-left font-semibold">Commission</th>
            <th className="px-4 py-3 text-left font-semibold">Stake</th>
            <th className="px-4 py-3 text-left font-semibold">Unclaimed Rewards</th>
            <th className="px-4 py-3 text-left font-semibold">Flags</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950/40 text-slate-200">
          {validators.map((validator) => (
            <tr key={validator.id} className="hover:bg-slate-900/40">
              <td className="px-4 py-3 font-mono text-xs text-slate-300">
                <Link
                  href={{
                    pathname: `/validators/${validator.id}`,
                    query: { network: currentNetwork }
                  }}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {validator.id}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                <ExplorerLink
                  config={networkConfig}
                  type="address"
                  value={validator.authAddress}
                  className="text-slate-300"
                >
                  {formatShortAddress(validator.authAddress)}
                </ExplorerLink>
              </td>
              <td className="px-4 py-3 text-slate-200">
                {validator.commission}
              </td>
              <td className="px-4 py-3 text-slate-200">
                {validator.stake}
              </td>
              <td className="px-4 py-3 text-slate-200">
                {validator.unclaimedRewards}
              </td>
              <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                {validator.flagsRaw}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
