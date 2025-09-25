"use client";

import { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useStakingSdk } from '@/hooks/useStakingSdk';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { NetworkSelector } from '@/app/components/network-selector';
import { ClientOnly } from '@/app/components/client-only';
import type { MonadNetwork } from '@monad-staking/config';
import { useSearchParams } from 'next/navigation';

function StakePageContent() {
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabled = getEnabledNetworkConfigs(configMap);
  const defaultNetwork = enabled[0]?.key as MonadNetwork | undefined;
  const searchParams = useSearchParams();
  const networkParam = searchParams.get('network') ?? undefined;
  const networkKey = (enabled.find((n) => n.key === networkParam)?.key ?? defaultNetwork) as MonadNetwork | undefined;

  const resolved = networkKey ? tryResolveNetwork(configMap, networkKey) : null;
  const sdk = useStakingSdk(resolved!);
  const { address } = useAccount();

  const [validatorId, setValidatorId] = useState('');
  const [amountMon, setAmountMon] = useState('');
  const [withdrawId, setWithdrawId] = useState(1);
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const account = address as `0x${string}` | undefined;
  const validatorBig = (() => { try { return BigInt(validatorId || '0'); } catch { return 0n; } })();
  const amountWei = (() => {
    if (!amountMon) return 0n;
    const [int, frac = ''] = amountMon.split('.');
    const fracPadded = (frac + '0'.repeat(18)).slice(0, 18);
    return BigInt(int || '0') * (10n ** 18n) + BigInt(fracPadded || '0');
  })();

  const canTransact = Boolean(sdk && account && validatorBig > 0n && amountWei > 0n && !busy);

  if (!resolved) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-100">Stake</h1>
        <p className="text-slate-400">Selected network is not fully configured. Please set RPC URL and chain ID.</p>
      </div>
    );
  }

  async function run<T>(fn: () => Promise<T>) {
    setTxError(null); setTxHash(null); setBusy(true);
    try {
      const res: unknown = await fn();
      if (typeof res === 'string') setTxHash(res);
    } catch (e) {
      setTxError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Stake</h1>
          <p className="mt-2 text-slate-400">Stake, undelegate, claim, and manage rewards.</p>
        </div>
        <div className="w-full max-w-xs">
          <NetworkSelector
            networks={enabled}
            selectedKey={networkKey ?? null}
          />
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Parameters</h2>
          <div className="grid gap-4">
            <label className="text-sm">
              <span className="mb-1 block text-slate-300">Validator ID</span>
              <input
                value={validatorId}
                onChange={(e) => setValidatorId(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
                placeholder="e.g. 12"
                inputMode="numeric"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-300">Amount (MON)</span>
              <input
                value={amountMon}
                onChange={(e) => setAmountMon(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
                placeholder="e.g. 1.25"
                inputMode="decimal"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-300">Withdraw ID (1–255)</span>
              <input
                value={withdrawId}
                onChange={(e) => setWithdrawId(Math.max(1, Math.min(255, Number(e.target.value || 1))))}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
                placeholder="1"
                inputMode="numeric"
                type="number"
                min={1}
                max={255}
              />
            </label>
            {txError ? (
              <div className="rounded-md border border-red-900/40 bg-red-950/40 p-2 text-sm text-red-300">{txError}</div>
            ) : null}
            {txHash ? (
              <div className="rounded-md border border-emerald-900/40 bg-emerald-950/40 p-2 text-sm text-emerald-300">Submitted: {txHash}</div>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canTransact}
              onClick={() => run(() => sdk!.delegate({ validatorId: validatorBig, amount: amountWei, account: account! }))}
            >
              Delegate
            </button>
            <button
              className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canTransact}
              onClick={() => run(() => sdk!.undelegate({ validatorId: validatorBig, amount: amountWei, withdrawalId: withdrawId, account: account! }))}
            >
              Undelegate
            </button>
            <button
              className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!sdk || !account || validatorBig <= 0n}
              onClick={() => run(() => sdk!.withdraw({ validatorId: validatorBig, withdrawalId: withdrawId, account: account! }))}
            >
              Withdraw
            </button>
            <button
              className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!sdk || !account || validatorBig <= 0n}
              onClick={() => run(() => sdk!.claimRewards({ validatorId: validatorBig, account: account! }))}
            >
              Claim Rewards
            </button>
            <button
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!sdk || !account || validatorBig <= 0n}
              onClick={() => run(() => sdk!.compound({ validatorId: validatorBig, account: account! }))}
            >
              Compound
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Note: Delegation/undelegation effectiveness depends on the boundary block. Withdrawals are available after the configured withdrawal delay.
          </p>
        </section>
      </div>
    </div>
  );
}

export default function StakePage() {
  return (
    <ClientOnly fallback={
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-100">Stake</h1>
        <p className="text-slate-400">Loading...</p>
      </div>
    }>
      <StakePageContent />
    </ClientOnly>
  );
}
