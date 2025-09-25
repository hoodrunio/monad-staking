'use client';

import { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { useStakingSdk } from '@/hooks/useStakingSdk';
import { useEpochQuery } from '@/lib/queries';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { parseNetworkKey } from '@/lib/validators';
import { NetworkSelector } from '@/app/components/network-selector';
import { ClientOnly } from '@/app/components/client-only';
import { WithdrawIdPicker } from '@/app/components/withdraw-id-picker';
import { EffectiveEpochsInfo } from '@/app/components/effective-epochs-info';
import { TransactionResult } from '@/app/components/transaction-result';
import { LoadingSkeleton } from '@/app/components/loading-skeleton';
import type { MonadNetwork } from '@monad-staking/config';
import {
  parseValidatorId,
  parseAmountToWei,
  canPerformTransaction,
  handleDelegate,
  handleUndelegate,
  handleWithdraw,
  handleCompound,
  handleClaimRewards,
  type StakeFormData,
  type StakeFormState,
} from '@/lib/stake-utils';

function StakePageContent() {
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabled = getEnabledNetworkConfigs(configMap);
  const searchParams = useSearchParams();
  
  const networkParam = searchParams.get('network') ?? undefined;
  const requestedNetwork = parseNetworkKey(networkParam);
  const selectedNetwork = (requestedNetwork ?? enabled[0]?.key) as MonadNetwork | undefined;

  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;
  const sdk = useStakingSdk(resolved!);
  const { address } = useAccount();

  const [formData, setFormData] = useState<StakeFormData>({
    validatorId: '',
    amountMon: '',
    withdrawId: 1,
  });

  const [state, setState] = useState<StakeFormState>({
    txError: null,
    txHash: null,
    busy: false,
  });

  const { data: epochData, isLoading: epochLoading } = useEpochQuery(selectedNetwork!);

  const account = address as `0x${string}` | undefined;
  const validatorBig = parseValidatorId(formData.validatorId);
  const amountWei = parseAmountToWei(formData.amountMon);
  const canTransact = canPerformTransaction(sdk, account, validatorBig, amountWei, state.busy);

  const updateFormData = (updates: Partial<StakeFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateState = (updates: Partial<StakeFormState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  if (!resolved) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-100">Stake</h1>
        <p className="text-slate-400">Selected network is not fully configured.</p>
      </div>
    );
  }

  if (!selectedNetwork) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Stake Operations</h1>
          <p className="text-slate-400">
            Manage your delegations on {resolved.key}
          </p>
        </div>
        <NetworkSelector networks={enabled} selectedKey={selectedNetwork} />
      </header>

      {epochLoading ? (
        <LoadingSkeleton className="h-16 w-full" />
      ) : epochData ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Current Epoch</h2>
          <div className="text-sm text-slate-300">
            <p>Epoch: {epochData.epoch}</p>
            <p>In delay period: {epochData.inEpochDelayPeriod ? 'Yes' : 'No'}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Delegate */}
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-emerald-200">Delegate</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Validator ID
              </label>
              <input
                type="text"
                value={formData.validatorId}
                onChange={(e) => updateFormData({ validatorId: e.target.value })}
                disabled={state.busy}
                placeholder="Enter validator ID"
                className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount (MON)
              </label>
              <input
                type="text"
                value={formData.amountMon}
                onChange={(e) => updateFormData({ amountMon: e.target.value })}
                disabled={state.busy}
                placeholder="0.0"
                className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              />
            </div>
            {epochData && (
              <EffectiveEpochsInfo
                currentEpoch={BigInt(epochData.epoch)}
                inEpochDelayPeriod={epochData.inEpochDelayPeriod}
                withdrawalDelay={epochData.withdrawalDelay}
                actionType="delegate"
              />
            )}
            <button
              onClick={() => handleDelegate(sdk!, validatorBig, amountWei, updateState)}
              disabled={!canTransact}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.busy ? 'Processing...' : 'Delegate'}
            </button>
          </div>
        </section>

        {/* Undelegate */}
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-amber-200">Undelegate</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Validator ID
              </label>
              <input
                type="text"
                value={formData.validatorId}
                onChange={(e) => updateFormData({ validatorId: e.target.value })}
                disabled={state.busy}
                placeholder="Enter validator ID"
                className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount (MON)
              </label>
              <input
                type="text"
                value={formData.amountMon}
                onChange={(e) => updateFormData({ amountMon: e.target.value })}
                disabled={state.busy}
                placeholder="0.0"
                className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Withdrawal ID
              </label>
              <WithdrawIdPicker
                network={selectedNetwork}
                address={address}
                validatorId={formData.validatorId}
                value={formData.withdrawId}
                onChange={(id) => updateFormData({ withdrawId: id })}
                disabled={state.busy}
              />
            </div>
            {epochData && (
              <EffectiveEpochsInfo
                currentEpoch={BigInt(epochData.epoch)}
                inEpochDelayPeriod={epochData.inEpochDelayPeriod}
                withdrawalDelay={epochData.withdrawalDelay}
                actionType="undelegate"
              />
            )}
            <button
              onClick={() => handleUndelegate(sdk!, validatorBig, amountWei, formData.withdrawId, updateState)}
              disabled={!canTransact}
              className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.busy ? 'Processing...' : 'Undelegate'}
            </button>
          </div>
        </section>

        {/* Withdraw */}
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-red-200">Withdraw</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Validator ID
              </label>
              <input
                type="text"
                value={formData.validatorId}
                onChange={(e) => updateFormData({ validatorId: e.target.value })}
                disabled={state.busy}
                placeholder="Enter validator ID"
                className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Withdrawal ID
              </label>
              <WithdrawIdPicker
                network={selectedNetwork}
                address={address}
                validatorId={formData.validatorId}
                value={formData.withdrawId}
                onChange={(id) => updateFormData({ withdrawId: id })}
                disabled={state.busy}
              />
            </div>
            <button
              onClick={() => handleWithdraw(sdk!, validatorBig, formData.withdrawId, updateState)}
              disabled={!sdk || !account || validatorBig <= 0n || state.busy}
              className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.busy ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </section>

        {/* Compound & Claim */}
        <section className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-blue-200">Compound</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Validator ID
              </label>
              <input
                type="text"
                value={formData.validatorId}
                onChange={(e) => updateFormData({ validatorId: e.target.value })}
                disabled={state.busy}
                placeholder="Enter validator ID"
                className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <button
              onClick={() => handleCompound(sdk!, validatorBig, updateState)}
              disabled={!sdk || !account || validatorBig <= 0n || state.busy}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.busy ? 'Processing...' : 'Compound Rewards'}
            </button>
          </div>

          <hr className="border-slate-700" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-purple-200">Claim Rewards</h2>
            <button
              onClick={() => handleClaimRewards(sdk!, validatorBig, updateState)}
              disabled={!sdk || !account || validatorBig <= 0n || state.busy}
              className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.busy ? 'Processing...' : 'Claim Rewards'}
            </button>
          </div>
        </section>
      </div>

      <TransactionResult
        txHash={state.txHash}
        txError={state.txError}
        networkConfig={resolved}
      />
    </div>
  );
}

export default function StakePage() {
  return (
    <ClientOnly>
      <StakePageContent />
    </ClientOnly>
  );
}