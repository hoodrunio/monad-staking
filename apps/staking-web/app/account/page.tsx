'use client';

import { useMemo, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { NetworkSelector } from '@/app/components/network-selector';
import { getNetworkConfigMap, getEnabledNetworkConfigs } from '@/lib/networks';
import { apiGet } from '@/lib/api';
import { ClientOnly } from '@/app/components/client-only';
import type { MonadNetwork } from '@monad-staking/config';
import { useSearchParams } from 'next/navigation';

type DelegationItem = {
  validatorId: string;
  stake: string;
  unclaimedRewards: string;
  deltaStake: string;
  nextDeltaStake: string;
  deltaEpoch: string;
  nextDeltaEpoch: string;
};

type WithdrawalItem = {
  validatorId: string;
  withdrawalId: number;
  amount: string;
  withdrawEpoch: string;
};

async function fetchDelegations(network: MonadNetwork, address: string) {
  return apiGet<{
    items: DelegationItem[];
    cursor: { next: string; done: boolean };
  }>('/api/delegations', { network, address, cursor: '0' });
}

async function fetchWithdrawals(network: MonadNetwork, address: string) {
  return apiGet<{
    items: WithdrawalItem[];
    nextStartId: number | null;
  }>('/api/withdrawals', { network, address, startId: 1, limit: 64 });
}

function DelegationsSection({ items }: { items: DelegationItem[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Delegations</h2>
      {items.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">No delegations found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Validator ID</th>
                <th className="px-4 py-3 text-left font-semibold">Stake</th>
                <th className="px-4 py-3 text-left font-semibold">Unclaimed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40 text-slate-200">
              {items.map((d) => (
                <tr key={`${d.validatorId}`}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{d.validatorId}</td>
                  <td className="px-4 py-3">{d.stake}</td>
                  <td className="px-4 py-3">{d.unclaimedRewards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function WithdrawalsSection({ items }: { items: WithdrawalItem[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Withdrawals</h2>
      {items.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">No withdrawals found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Validator ID</th>
                <th className="px-4 py-3 text-left font-semibold">Withdraw ID</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Withdraw Epoch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40 text-slate-200">
              {items.map((w) => (
                <tr key={`${w.validatorId}-${w.withdrawalId}`}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{w.validatorId}</td>
                  <td className="px-4 py-3">{w.withdrawalId}</td>
                  <td className="px-4 py-3">{w.amount}</td>
                  <td className="px-4 py-3">{w.withdrawEpoch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AccountPageContent() {
  const { address } = useAccount();
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabled = getEnabledNetworkConfigs(configMap);
  const searchParams = useSearchParams();
  const networkParam = searchParams.get('network');
  const network = (enabled.find((n) => n.key === networkParam)?.key ?? enabled[0]?.key) as MonadNetwork | undefined;

  const [delegations, setDelegations] = useState<DelegationItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !network) return;
    setLoading(true);
    setError(null);
    
    Promise.all([
      fetchDelegations(network, address),
      fetchWithdrawals(network, address),
    ])
      .then(([delData, withData]) => {
        setDelegations(delData.items);
        setWithdrawals(withData.items);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [address, network]);

  if (!network) return null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Account</h1>
          <p className="mt-2 text-slate-400">Your delegations and withdrawals</p>
        </div>
        <div className="w-full max-w-xs">
          <NetworkSelector networks={enabled} selectedKey={network} />
        </div>
      </header>

      {!address ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300">
          Connect your wallet to view your positions.
        </div>
      ) : loading ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300">
          Loading your positions...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-6 text-sm text-red-300">
          {error}
        </div>
      ) : (
        <>
          <DelegationsSection items={delegations} />
          <WithdrawalsSection items={withdrawals} />
        </>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <ClientOnly fallback={
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Account</h1>
        <p className="text-slate-400">Loading...</p>
      </div>
    }>
      <AccountPageContent />
    </ClientOnly>
  );
}