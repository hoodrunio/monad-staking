import type { ValidatorRow } from '@/lib/validators';
import { formatValidatorRow } from '@/lib/validators';

interface ValidatorTableProps {
  readonly validators: readonly ValidatorRow[];
}

export function ValidatorTable({ validators }: ValidatorTableProps) {
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
            <th className="px-4 py-3 text-left font-semibold">Execution Stake</th>
            <th className="px-4 py-3 text-left font-semibold">Consensus Stake</th>
            <th className="px-4 py-3 text-left font-semibold">Snapshot Stake</th>
            <th className="px-4 py-3 text-left font-semibold">Unclaimed Rewards</th>
            <th className="px-4 py-3 text-left font-semibold">Flags</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950/40 text-slate-200">
          {validators.map((validator) => {
            const formatted = formatValidatorRow(validator);
            return (
              <tr key={formatted.id} className="hover:bg-slate-900/40">
                <td className="px-4 py-3 font-mono text-xs text-slate-300">
                  {formatted.id}
                </td>
                <td
                  className="px-4 py-3 font-mono text-xs"
                  title={formatted.authAddress ?? undefined}
                >
                  {formatted.authAddressShort ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {formatted.error ? '—' : formatted.commission ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {formatted.error ? '—' : formatted.stake ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {formatted.error ? '—' : formatted.consensusStake ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {formatted.error ? '—' : formatted.snapshotStake ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {formatted.error ? '—' : formatted.unclaimedRewards ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {formatted.error ? (
                    <span className="text-red-400">{formatted.error}</span>
                  ) : (
                    formatted.flags ?? '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
