'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import type { MonadNetwork } from '@monad-staking/config';
import { ClientOnly } from '@/app/components/client-only';
import { NetworkSelector } from '@/app/components/network-selector';
import { LoadingSkeleton } from '@/app/components/loading-skeleton';
import { TransactionResult } from '@/app/components/transaction-result';
import { EffectiveEpochsInfo } from '@/app/components/effective-epochs-info';
import { useStakingSdk } from '@/hooks/useStakingSdk';
import { ValidatorSelector } from '@/app/components/validator-selector';
import {
  useDelegationsQuery,
  useEpochQuery,
  useValidatorsQuery,
  useWithdrawalsQuery,
} from '@/lib/queries';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { parseNetworkKey } from '@/lib/validators';
import {
  parseAmountToWei,
  parseValidatorId,
  canPerformTransaction,
  handleDelegate,
  handleUndelegate,
  handleWithdraw,
  handleCompound,
  handleClaimRewards,
  type StakeFormState,
} from '@/lib/stake-utils';
import {
  formatMonFromWei,
  getNextAvailableWithdrawId,
  monWeiToDecimalString,
  parseFormattedMon,
} from '@/lib/utils';

const actionTabs = [
  { key: 'stake', label: 'Stake' },
  { key: 'unstake', label: 'Unstake' },
  { key: 'withdraw', label: 'Withdraw' },
] as const;

type ActionKey = (typeof actionTabs)[number]['key'];

type StakeForm = {
  validatorId: string;
  amount: string;
};

type DelegationSummary = {
  validatorId: string;
  stakeMon: number;
  unclaimedMon: number;
};

function sanitizeAmount(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return cleaned;
}

function StakePageContent() {
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabledNetworks = getEnabledNetworkConfigs(configMap);
  const searchParams = useSearchParams();

  const networkParam = searchParams.get('network') ?? undefined;
  const requestedNetwork = parseNetworkKey(networkParam);
  const selectedNetwork = (requestedNetwork ?? enabledNetworks[0]?.key) as MonadNetwork | undefined;

  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;
  const sdk = useStakingSdk(resolved!);
  const { address } = useAccount();
  const account = address as `0x${string}` | undefined;

  const [state, setState] = useState<StakeFormState>({
    busy: false,
    busyAction: null,
    txError: null,
    txHash: null,
    txStage: 'idle',
  });
  const [action, setAction] = useState<ActionKey>('stake');
  const [stakeForm, setStakeForm] = useState<StakeForm>({ validatorId: '', amount: '' });
  const [unstakeForm, setUnstakeForm] = useState<StakeForm>({ validatorId: '', amount: '' });
  const [showResultModal, setShowResultModal] = useState(false);

  const { data: epochData, isLoading: epochLoading } = useEpochQuery(selectedNetwork!, {
    enabled: !!selectedNetwork && !!resolved,
  });

  const { data: validatorsData, isLoading: validatorsLoading, error: validatorsError } =
    useValidatorsQuery(selectedNetwork!, '', 100, {
      enabled: !!selectedNetwork && !!resolved,
    });

  const { data: delegationsData, isLoading: delegationsLoading } = useDelegationsQuery(
    selectedNetwork!,
    address ?? '',
    '0',
    { enabled: !!selectedNetwork && !!resolved && !!address }
  );

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useWithdrawalsQuery(
    selectedNetwork!,
    address ?? '',
    undefined,
    { enabled: !!selectedNetwork && !!resolved && !!address }
  );

  const validatorItems = useMemo(() => validatorsData?.items ?? [], [validatorsData]);
  const validatorLookup = useMemo(() => {
    return new Map(validatorItems.map((validator) => [validator.validatorId, validator]));
  }, [validatorItems]);

  const stakeValidatorOptions = useMemo(() => {
    return validatorItems.map((validator) => ({
      value: validator.validatorId,
      title: validator.meta?.name ?? `Validator ${validator.validatorId}`,
      subtitle: `ID ${validator.validatorId} • Commission ${validator.commission}`,
      stats: [
        { label: 'Execution', value: validator.stake.execution },
        { label: 'Consensus', value: validator.stake.consensus },
        { label: 'Snapshot', value: validator.stake.snapshot },
      ],
    }));
  }, [validatorItems]);

  useEffect(() => {
    if (!stakeForm.validatorId && stakeValidatorOptions.length > 0) {
      setStakeForm((prev) => ({ ...prev, validatorId: stakeValidatorOptions[0]!.value }));
    }
  }, [stakeForm.validatorId, stakeValidatorOptions]);

  const delegationItems = useMemo(() => delegationsData?.items ?? [], [delegationsData]);

  const delegatedValidatorOptions = useMemo(() => {
    return delegationItems.map((delegation) => {
      const info = validatorLookup.get(delegation.validatorId);
      return {
        value: delegation.validatorId,
        title: info?.meta?.name ?? `Validator ${delegation.validatorId}`,
        subtitle: `ID ${delegation.validatorId} • Stake ${delegation.stake}`,
        stats: [
          { label: 'Rewards', value: delegation.unclaimedRewards },
          { label: 'Pending', value: delegation.deltaStake },
        ],
      };
    });
  }, [delegationItems, validatorLookup]);

  useEffect(() => {
    if (!unstakeForm.validatorId && delegatedValidatorOptions.length > 0) {
      const first = delegatedValidatorOptions[0]!;
      setUnstakeForm({
        validatorId: first.value,
        amount: sanitizeAmount(
          delegationItems.find((item) => item.validatorId === first.value)?.stake ?? '',
        ),
      });
    }
  }, [unstakeForm.validatorId, delegatedValidatorOptions, delegationItems]);

  const updateState = (partial: Partial<StakeFormState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  };

  const isBusy = state.busy;
  const busyAction = state.busyAction;
  const isActionBusy = (key: string) => isBusy && busyAction === key;

  const stakeValidatorBig = parseValidatorId(stakeForm.validatorId);
  const stakeAmountWei = parseAmountToWei(stakeForm.amount);
  const canStake = canPerformTransaction(sdk, account, stakeValidatorBig, stakeAmountWei, state.busy);

  const unstakeValidatorBig = parseValidatorId(unstakeForm.validatorId);
  const unstakeAmountWei = parseAmountToWei(unstakeForm.amount);

  const withdrawals = useMemo(() => withdrawalsData?.items ?? [], [withdrawalsData]);
  const currentEpoch = epochData ? BigInt(epochData.epoch) : null;

  const withdrawalsByValidator = useMemo(() => {
    const map = new Map<string, number[]>();
    withdrawals.forEach((item) => {
      const list = map.get(item.validatorId) ?? [];
      list.push(item.withdrawalId);
      map.set(item.validatorId, list);
    });
    return map;
  }, [withdrawals]);

  const suggestedWithdrawalId = useMemo(() => {
    if (!unstakeForm.validatorId) return null;
    const used = withdrawalsByValidator.get(unstakeForm.validatorId) ?? [];
    return getNextAvailableWithdrawId(used);
  }, [unstakeForm.validatorId, withdrawalsByValidator]);

  const canUnstake = Boolean(
    sdk &&
      account &&
      unstakeValidatorBig > 0n &&
      unstakeAmountWei > 0n &&
      !state.busy &&
      suggestedWithdrawalId !== null,
  );

  const readyWithdrawals = useMemo(() => {
    if (!currentEpoch) return [] as typeof withdrawals;
    return withdrawals.filter((withdrawal) => BigInt(withdrawal.withdrawEpoch) <= currentEpoch);
  }, [withdrawals, currentEpoch]);

  const pendingWithdrawals = useMemo(() => {
    if (!currentEpoch) return withdrawals;
    return withdrawals.filter((withdrawal) => BigInt(withdrawal.withdrawEpoch) > currentEpoch);
  }, [withdrawals, currentEpoch]);

  const delegationSummaries: DelegationSummary[] = useMemo(() => {
    return delegationItems.map((delegation) => ({
      validatorId: delegation.validatorId,
      stakeMon: Number(parseFormattedMon(delegation.stake) || 0),
      unclaimedMon: Number(parseFormattedMon(delegation.unclaimedRewards) || 0),
    }));
  }, [delegationItems]);

  const totalStakedMon = delegationSummaries.reduce((sum, item) => sum + item.stakeMon, 0);
  const totalRewardsMon = delegationSummaries.reduce((sum, item) => sum + item.unclaimedMon, 0);
  const totalReadyWithdrawMon = readyWithdrawals.reduce(
    (sum, withdrawal) => sum + Number(monWeiToDecimalString(withdrawal.amount, 6) || '0'),
    0,
  );
  const totalLockedWithdrawMon = pendingWithdrawals.reduce(
    (sum, withdrawal) => sum + Number(monWeiToDecimalString(withdrawal.amount, 6) || '0'),
    0,
  );

  useEffect(() => {
    if (!state.busy && ['submitted', 'confirmed', 'error'].includes(state.txStage)) {
      setShowResultModal(true);
    }
  }, [state.busy, state.txStage]);

  const closeResultModal = () => {
    setShowResultModal(false);
    updateState({ txHash: null, txError: null, txStage: 'idle' });
  };

  if (!resolved) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-100">Stake</h1>
          <p className="text-slate-400">Selected network is not fully configured.</p>
        </header>
      </div>
    );
  }

  if (!selectedNetwork) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-400">Staking dashboard</p>
          <h1 className="text-4xl font-semibold text-white">Stake</h1>
          <p className="text-slate-400">
            Manage your MON stake, undelegations, and withdrawals on {resolved.label}.
          </p>
        </div>
        <NetworkSelector networks={enabledNetworks} selectedKey={selectedNetwork} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Wallet</p>
            <p className="text-sm font-mono text-slate-300">
              {account ?? 'Connect wallet to manage stake'}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-300">Portfolio</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total staked</span>
                <span className="font-semibold text-emerald-200">
                  {totalStakedMon.toLocaleString(undefined, { maximumFractionDigits: 2 })} MON
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rewards</span>
                <span className="font-semibold text-emerald-200">
                  {totalRewardsMon.toLocaleString(undefined, { maximumFractionDigits: 2 })} MON
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pending withdraw</span>
                <span className="font-semibold text-emerald-200">
                  {totalLockedWithdrawMon.toLocaleString(undefined, { maximumFractionDigits: 2 })} MON
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ready to claim</span>
                <span className="font-semibold text-emerald-200">
                  {totalReadyWithdrawMon.toLocaleString(undefined, { maximumFractionDigits: 2 })} MON
                </span>
              </div>
            </div>
          </div>

          <div>
            <nav className="flex gap-3">
              {actionTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAction(tab.key)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    action === tab.key
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-100'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="mt-5 space-y-6">
              {action === 'stake' && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!sdk || !account || !canStake) return;
                    void handleDelegate(
                      sdk,
                      stakeValidatorBig,
                      stakeAmountWei,
                      account,
                      setState,
                      'stake',
                    );
                  }}
                  className="space-y-4"
                >
                  {validatorsError && (
                    <div className="rounded-md border border-red-900/40 bg-red-950/40 p-3 text-xs text-red-200">
                      Failed to load validator list.
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-slate-300">
                    <span className="font-medium text-slate-200">Validator</span>
                    <ValidatorSelector
                      options={stakeValidatorOptions}
                      value={stakeForm.validatorId}
                      onChange={(next) => setStakeForm((prev) => ({ ...prev, validatorId: next }))}
                      loading={validatorsLoading}
                      disabled={isBusy}
                      emptyMessage="No validators configured for this network"
                    />
                  </div>

                  <label className="block text-sm text-slate-300">
                    Amount (MON)
                    <input
                      type="text"
                      value={stakeForm.amount}
                      onChange={(event) => setStakeForm((prev) => ({ ...prev, amount: event.target.value }))}
                      disabled={isBusy}
                      placeholder="0.0"
                      className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </label>

                  {epochData && (
                    <EffectiveEpochsInfo
                      currentEpoch={BigInt(epochData.epoch)}
                      inEpochDelayPeriod={epochData.inEpochDelayPeriod}
                      withdrawalDelay={epochData.withdrawalDelay}
                      actionType="delegate"
                    />
                  )}

                  <button
                    type="submit"
                    disabled={!canStake}
                    className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    {isActionBusy('stake') ? 'Submitting…' : 'Stake'}
                  </button>
                </form>
              )}

              {action === 'unstake' && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!sdk || !account || !canUnstake || suggestedWithdrawalId === null) return;
                    void handleUndelegate(
                      sdk,
                      unstakeValidatorBig,
                      unstakeAmountWei,
                      suggestedWithdrawalId,
                      account,
                      setState,
                      'unstake',
                    );
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2 text-sm text-slate-300">
                    <span className="font-medium text-slate-200">My validator</span>
                    <ValidatorSelector
                      options={delegatedValidatorOptions}
                      value={unstakeForm.validatorId}
                      onChange={(next) => {
                        const delegation = delegationItems.find((item) => item.validatorId === next);
                        setUnstakeForm({
                          validatorId: next,
                          amount: delegation ? sanitizeAmount(delegation.stake) : '',
                        });
                      }}
                      loading={delegationsLoading}
                      disabled={isBusy || delegationItems.length === 0}
                      emptyMessage="You have no active delegations yet"
                    />
                  </div>

                  <label className="block text-sm text-slate-300">
                    Amount (MON)
                    <input
                      type="text"
                      value={unstakeForm.amount}
                      onChange={(event) => setUnstakeForm((prev) => ({ ...prev, amount: event.target.value }))}
                      disabled={isBusy || !unstakeForm.validatorId}
                      placeholder="0.0"
                      className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </label>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
                    {suggestedWithdrawalId !== null ? (
                      <p>Withdrawal slot <span className="font-semibold text-emerald-300">#{suggestedWithdrawalId}</span> will be reserved for this request.</p>
                    ) : (
                      <p className="text-amber-300">All withdrawal slots for this validator are in use. Complete or cancel an existing withdrawal before submitting a new one.</p>
                    )}
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
                    type="submit"
                    disabled={!canUnstake}
                    className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    {isActionBusy('unstake') ? 'Submitting…' : 'Start undelegation'}
                  </button>
                </form>
              )}

              {action === 'withdraw' && (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>Withdrawals become available once the waiting period ends. Ready entries can be claimed instantly below.</p>
                    <p className="text-xs text-slate-500">
                      {readyWithdrawals.length} ready · {pendingWithdrawals.length} pending
                    </p>
                  </div>

                  {withdrawalsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <LoadingSkeleton key={index} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : readyWithdrawals.length === 0 ? (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
                      No withdrawals are ready yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {readyWithdrawals.map((withdrawal) => (
                        <div
                          key={`${withdrawal.validatorId}-${withdrawal.withdrawalId}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-100"
                        >
                          <div>
                            <p className="font-semibold">
                              Validator {withdrawal.validatorId} · Slot #{withdrawal.withdrawalId}
                            </p>
                            <p className="text-xs text-emerald-300">{formatMonFromWei(withdrawal.amount)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!sdk || !account || isBusy) return;
                              void handleWithdraw(
                                sdk,
                                parseValidatorId(withdrawal.validatorId),
                                withdrawal.withdrawalId,
                                account,
                                setState,
                                'withdraw',
                              );
                            }}
                            disabled={!sdk || !account || isBusy}
                            className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:pointer-events-none"
                          >
                            {isActionBusy('withdraw') ? 'Processing…' : 'Withdraw'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="space-y-8">
          {epochLoading ? (
            <LoadingSkeleton className="h-40 w-full" />
          ) : (
            epochData && (
              <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-6 md:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Epoch</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-200">{epochData.epoch}</p>
                  <p className="text-xs text-slate-500">{epochData.inEpochDelayPeriod ? 'Delay period active' : 'Live epoch'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Withdrawal delay</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-200">{epochData.withdrawalDelay}</p>
                  <p className="text-xs text-slate-500">Epochs until withdrawals unlock</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Ready withdrawals</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-200">
                    {totalReadyWithdrawMon.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-500">MON available now</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Pending withdrawals</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-200">
                    {totalLockedWithdrawMon.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-500">Unlocking soon</p>
                </div>
              </div>
            )
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">My validators</h2>
              <p className="text-xs text-slate-500">Manage stake per validator without using raw IDs.</p>
            </div>

            {delegationsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="h-28 w-full" />
                ))}
              </div>
            ) : delegationItems.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-300">
                You have no active delegations yet. Stake MON to get started.
              </div>
            ) : (
              <div className="grid gap-4">
                {delegationItems.map((delegation) => {
                  const validatorInfo = validatorLookup.get(delegation.validatorId);
                  return (
                    <div
                      key={delegation.validatorId}
                      className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-wide text-slate-500">Validator</p>
                          <h3 className="text-xl font-semibold text-slate-100">
                            {validatorInfo?.meta?.name ?? `Validator ${delegation.validatorId}`}
                          </h3>
                          <p className="text-xs text-slate-500">ID {delegation.validatorId}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Stake</p>
                            <p className="mt-1 font-mono text-slate-100">{delegation.stake}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Rewards</p>
                            <p className="mt-1 font-mono text-slate-100">{delegation.unclaimedRewards}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Pending change</p>
                            <p className="mt-1 font-mono text-slate-300">{formatMonFromWei(delegation.deltaStake)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Next change</p>
                            <p className="mt-1 font-mono text-slate-300">{formatMonFromWei(delegation.nextDeltaStake)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAction('unstake');
                            setUnstakeForm({
                              validatorId: delegation.validatorId,
                              amount: sanitizeAmount(delegation.stake),
                            });
                          }}
                          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200 hover:border-amber-500"
                        >
                          Unstake
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!sdk || !account || isBusy) return;
                            void handleCompound(
                              sdk,
                              parseValidatorId(delegation.validatorId),
                              account,
                              setState,
                              'compound',
                            );
                          }}
                          disabled={!sdk || !account || isBusy}
                          className="rounded-md border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-200 hover:border-blue-500 disabled:cursor-not-allowed disabled:pointer-events-none"
                        >
                          {isActionBusy('compound') ? 'Processing…' : 'Compound'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!sdk || !account || isBusy) return;
                            void handleClaimRewards(
                              sdk,
                              parseValidatorId(delegation.validatorId),
                              account,
                              setState,
                              'claim',
                            );
                          }}
                          disabled={!sdk || !account || isBusy}
                          className="rounded-md border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-200 hover:border-purple-500 disabled:cursor-not-allowed disabled:pointer-events-none"
                        >
                          {isActionBusy('claim') ? 'Processing…' : 'Claim rewards'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Pending withdrawals</h2>
            {withdrawalsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-300">
                No withdrawals in queue.
              </div>
            ) : (
              <div className="grid gap-3">
                {withdrawals.map((withdrawal) => {
                  const ready = currentEpoch ? BigInt(withdrawal.withdrawEpoch) <= currentEpoch : false;
                  return (
                    <div
                      key={`${withdrawal.validatorId}-${withdrawal.withdrawalId}`}
                      className={`rounded-xl border p-4 text-sm ${
                        ready
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-100'
                          : 'border-slate-800 bg-slate-950/40 text-slate-200'
                      }`}
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">
                            Validator {withdrawal.validatorId} · Slot #{withdrawal.withdrawalId}
                          </p>
                          <p className="text-xs text-slate-400">Unlocks at epoch {withdrawal.withdrawEpoch}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs">
                            {formatMonFromWei(withdrawal.amount)}
                          </span>
                          {ready ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!sdk || !account || isBusy) return;
                                void handleWithdraw(
                                  sdk,
                                  parseValidatorId(withdrawal.validatorId),
                                  withdrawal.withdrawalId,
                                  account,
                                  setState,
                                  'withdraw',
                                );
                              }}
                              disabled={!sdk || !account || isBusy}
                              className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:pointer-events-none"
                            >
                              {isActionBusy('withdraw') ? 'Processing…' : 'Withdraw'}
                            </button>
                          ) : (
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <TransactionResult
        txError={state.txError}
        txHash={state.txHash}
        networkConfig={resolved}
        open={showResultModal}
        onClose={closeResultModal}
        stage={state.txStage}
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
