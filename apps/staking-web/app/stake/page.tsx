'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { useStakingSdk } from '@/hooks/useStakingSdk';
import { useEpochQuery, useValidatorsQuery, useWithdrawalsQuery } from '@/lib/queries';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { parseNetworkKey } from '@/lib/validators';
import { NetworkSelector } from '@/app/components/network-selector';
import { ClientOnly } from '@/app/components/client-only';
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
  type StakeFormState,
} from '@/lib/stake-utils';
import { getNextAvailableWithdrawId } from '@/lib/utils';
import { formatWithdrawalRow } from '@/lib/account-utils';

type StakeAction = 'delegate' | 'undelegate' | 'withdraw' | 'compound' | 'claim';

const actionConfigs: ReadonlyArray<{
  key: StakeAction;
  label: string;
  description: string;
}> = [
  { key: 'delegate', label: 'Delegate', description: 'Increase your stake with a validator.' },
  { key: 'undelegate', label: 'Undelegate', description: 'Begin withdrawing stake with a reserved slot.' },
  { key: 'withdraw', label: 'Withdraw', description: 'Finalize completed undelegations and claim MON.' },
  { key: 'compound', label: 'Compound', description: 'Restake accrued rewards into your delegation.' },
  { key: 'claim', label: 'Claim rewards', description: 'Send rewards from the validator to your wallet.' },
];

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

  const [state, setState] = useState<StakeFormState>({
    txError: null,
    txHash: null,
    busy: false,
  });

  const [action, setAction] = useState<StakeAction>('delegate');
  const [selectedValidatorId, setSelectedValidatorId] = useState('');
  const [validatorSearch, setValidatorSearch] = useState('');
  const [delegateAmount, setDelegateAmount] = useState('');
  const [undelegateAmount, setUndelegateAmount] = useState('');

  const { data: epochData, isLoading: epochLoading } = useEpochQuery(selectedNetwork!);
  const { data: validatorsData, isLoading: validatorsLoading, error: validatorsError } =
    useValidatorsQuery(selectedNetwork!, '', 75, {
      enabled: !!selectedNetwork && !!resolved,
    });

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useWithdrawalsQuery(
    selectedNetwork!,
    address ?? '',
    undefined,
    { enabled: !!selectedNetwork && !!resolved && !!address }
  );

  const account = address as `0x${string}` | undefined;
  const validatorItems = useMemo(() => validatorsData?.items ?? [], [validatorsData]);

  useEffect(() => {
    if (!selectedValidatorId && validatorItems.length > 0) {
      setSelectedValidatorId(validatorItems[0]!.validatorId);
    }
  }, [selectedValidatorId, validatorItems]);

  const filteredValidators = useMemo(() => {
    if (!validatorSearch) return validatorItems;
    const term = validatorSearch.toLowerCase();
    return validatorItems.filter((validator) => {
      const name = validator.meta?.name ?? '';
      return (
        validator.validatorId.toLowerCase().includes(term) ||
        name.toLowerCase().includes(term) ||
        validator.authAddress.toLowerCase().includes(term)
      );
    });
  }, [validatorItems, validatorSearch]);

  const selectedValidator = useMemo(() => {
    if (!selectedValidatorId) return null;
    return validatorItems.find((validator) => validator.validatorId === selectedValidatorId) ?? null;
  }, [selectedValidatorId, validatorItems]);

  const validatorBig = parseValidatorId(selectedValidatorId);
  const delegateAmountWei = parseAmountToWei(delegateAmount);
  const undelegateAmountWei = parseAmountToWei(undelegateAmount);

  const updateState = (updates: Partial<StakeFormState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const canDelegate = canPerformTransaction(sdk, account, validatorBig, delegateAmountWei, state.busy);

  const withdrawalsByValidator = useMemo(() => {
    const items = withdrawalsData?.items ?? [];
    return selectedValidatorId
      ? items.filter((item) => item.validatorId === selectedValidatorId)
      : items;
  }, [withdrawalsData, selectedValidatorId]);

  const usedWithdrawalIds = useMemo(() => {
    if (!selectedValidatorId) return [] as number[];
    return (withdrawalsData?.items ?? [])
      .filter((item) => item.validatorId === selectedValidatorId)
      .map((item) => item.withdrawalId);
  }, [selectedValidatorId, withdrawalsData]);

  const suggestedWithdrawalId = useMemo(() => {
    if (!selectedValidatorId) return null;
    return getNextAvailableWithdrawId(usedWithdrawalIds);
  }, [selectedValidatorId, usedWithdrawalIds]);

  const canUndelegate = useMemo(() => {
    if (!sdk || !account || validatorBig <= 0n || state.busy) return false;
    if (undelegateAmountWei <= 0n) return false;
    return suggestedWithdrawalId !== null;
  }, [sdk, account, validatorBig, state.busy, undelegateAmountWei, suggestedWithdrawalId]);

  const currentEpochBig = epochData ? BigInt(epochData.epoch) : null;

  const readyWithdrawals = useMemo(() => {
    if (!currentEpochBig) return [] as typeof withdrawalsByValidator;
    return withdrawalsByValidator.filter((withdrawal) => BigInt(withdrawal.withdrawEpoch) <= currentEpochBig);
  }, [withdrawalsByValidator, currentEpochBig]);

  const pendingWithdrawals = useMemo(() => {
    if (!currentEpochBig) return withdrawalsByValidator;
    return withdrawalsByValidator.filter((withdrawal) => BigInt(withdrawal.withdrawEpoch) > currentEpochBig);
  }, [withdrawalsByValidator, currentEpochBig]);

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
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Stake Operations</h1>
          <p className="text-slate-400">
            Manage your stake on {resolved.key} with guided actions
          </p>
        </div>
        <NetworkSelector networks={enabled} selectedKey={selectedNetwork} />
      </header>

      {epochLoading ? (
        <LoadingSkeleton className="h-16 w-full" />
      ) : epochData ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-slate-100">Network Timing</h2>
          <div className="flex flex-wrap gap-6 text-sm text-slate-300">
            <div>
              <p className="text-slate-500">Current epoch</p>
              <p className="font-mono text-slate-100">{epochData.epoch}</p>
            </div>
            <div>
              <p className="text-slate-500">Delay period</p>
              <p>{epochData.inEpochDelayPeriod ? 'In delay period' : 'Outside delay period'}</p>
            </div>
            <div>
              <p className="text-slate-500">Withdrawal delay</p>
              <p>{epochData.withdrawalDelay} epochs</p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Choose an action</h2>
        <div className="flex flex-wrap gap-3">
          {actionConfigs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setAction(item.key)}
              className={`rounded-lg border px-4 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                action === item.key
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600'
              }`}
            >
              <p className="text-sm font-medium">{item.label}</p>
              <p className="mt-1 text-xs text-slate-400">{item.description}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-100">Select a validator</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Search by name, ID, or address to focus your action.
            </p>
            <div className="mt-4 space-y-4">
              <input
                type="search"
                placeholder="Search validators"
                value={validatorSearch}
                onChange={(event) => setValidatorSearch(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              {validatorsError ? (
                <div className="rounded-md border border-red-900/40 bg-red-950/30 p-3 text-xs text-red-200">
                  Failed to load validators.
                </div>
              ) : validatorsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <LoadingSkeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredValidators.length === 0 ? (
                <div className="rounded-md border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400">
                  No validators match this search.
                </div>
              ) : (
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {filteredValidators.map((validator) => (
                    <button
                      key={validator.validatorId}
                      type="button"
                      onClick={() => setSelectedValidatorId(validator.validatorId)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        selectedValidatorId === validator.validatorId
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-100'
                          : 'border-slate-800 bg-slate-950/50 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {validator.meta?.name ?? `Validator #${validator.validatorId}`}
                          </p>
                          <p className="text-xs text-slate-400">ID: {validator.validatorId}</p>
                        </div>
                        <span className="text-xs text-slate-400">
                          Commission {validator.commission}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                        <div>
                          <p className="uppercase tracking-wide text-slate-500">Execution</p>
                          <p className="font-mono text-slate-300">{validator.stake.execution}</p>
                        </div>
                        <div>
                          <p className="uppercase tracking-wide text-slate-500">Consensus</p>
                          <p className="font-mono text-slate-300">{validator.stake.consensus}</p>
                        </div>
                        <div>
                          <p className="uppercase tracking-wide text-slate-500">Snapshot</p>
                          <p className="font-mono text-slate-300">{validator.stake.snapshot}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedValidator ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              <h3 className="mb-2 text-sm font-semibold text-slate-100">Selected validator</h3>
              <p className="text-slate-200">
                {selectedValidator.meta?.name ?? `Validator #${selectedValidator.validatorId}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">{selectedValidator.authAddress}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Execution</p>
                  <p className="font-mono text-slate-200">{selectedValidator.stake.execution}</p>
                </div>
                <div>
                  <p className="text-slate-500">Consensus</p>
                  <p className="font-mono text-slate-200">{selectedValidator.stake.consensus}</p>
                </div>
                <div>
                  <p className="text-slate-500">Snapshot</p>
                  <p className="font-mono text-slate-200">{selectedValidator.stake.snapshot}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
              Select a validator to view details.
            </div>
          )}
        </aside>

        <section className="space-y-6">
          {action === 'delegate' && (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div>
                <h2 className="text-xl font-semibold text-emerald-200">Delegate MON</h2>
                <p className="text-sm text-slate-400">
                  Add stake to the selected validator.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Amount (MON)
                  <input
                    type="text"
                    value={delegateAmount}
                    onChange={(event) => setDelegateAmount(event.target.value)}
                    disabled={state.busy}
                    placeholder="0.0"
                    className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
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
              </div>

              <button
                onClick={() => handleDelegate(sdk!, validatorBig, delegateAmountWei, account!, updateState)}
                disabled={!canDelegate}
                className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state.busy ? 'Processing…' : 'Delegate'}
              </button>
            </div>
          )}

          {action === 'undelegate' && (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div>
                <h2 className="text-xl font-semibold text-amber-200">Undelegate stake</h2>
                <p className="text-sm text-slate-400">
                  We automatically reserve the next withdrawal slot for you.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Amount (MON)
                  <input
                    type="text"
                    value={undelegateAmount}
                    onChange={(event) => setUndelegateAmount(event.target.value)}
                    disabled={state.busy}
                    placeholder="0.0"
                    className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                  />
                </label>

                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
                  {suggestedWithdrawalId !== null ? (
                    <p>
                      Withdrawal slot <span className="font-semibold">#{suggestedWithdrawalId}</span> will be reserved for this request.
                    </p>
                  ) : (
                    <p className="text-amber-300">
                      All withdrawal slots for this validator are used. Withdraw existing requests before creating a new one.
                    </p>
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
              </div>

              <button
                onClick={() => handleUndelegate(
                  sdk!,
                  validatorBig,
                  undelegateAmountWei,
                  suggestedWithdrawalId ?? 1,
                  account!,
                  updateState,
                )}
                disabled={!canUndelegate}
                className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state.busy ? 'Processing…' : 'Start undelegation'}
              </button>
            </div>
          )}

          {action === 'withdraw' && (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div>
                <h2 className="text-xl font-semibold text-red-200">Withdraw MON</h2>
                <p className="text-sm text-slate-400">
                  Review your pending withdrawals and finalize the ones that are ready.
                </p>
              </div>

              {withdrawalsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <LoadingSkeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              ) : withdrawalsByValidator.length === 0 ? (
                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
                  {address ? 'No pending withdrawals found.' : 'Connect your wallet to view withdrawals.'}
                </div>
              ) : (
                <div className="space-y-6">
                  {readyWithdrawals.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-emerald-200">Ready now</h3>
                      <div className="space-y-3">
                        {readyWithdrawals.map((withdrawal) => {
                          const formatted = formatWithdrawalRow(withdrawal);
                          return (
                            <div
                              key={`${withdrawal.validatorId}-${withdrawal.withdrawalId}`}
                              className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-4 text-sm text-emerald-100"
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="font-semibold">
                                    {`Validator ${withdrawal.validatorId}`} · Slot #{withdrawal.withdrawalId}
                                  </p>
                                  <p className="text-xs text-emerald-300">Amount: {formatted.amount}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleWithdraw(
                                    sdk!,
                                    parseValidatorId(withdrawal.validatorId),
                                    withdrawal.withdrawalId,
                                    account!,
                                    updateState,
                                  )}
                                  disabled={!sdk || !account || state.busy}
                                  className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-emerald-950 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {state.busy ? 'Processing…' : 'Withdraw now'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {pendingWithdrawals.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-200">Pending</h3>
                      <div className="space-y-3">
                        {pendingWithdrawals.map((withdrawal) => {
                          const formatted = formatWithdrawalRow(withdrawal);
                          return (
                            <div
                              key={`pending-${withdrawal.validatorId}-${withdrawal.withdrawalId}`}
                              className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-200"
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="font-semibold">
                                    {`Validator ${withdrawal.validatorId}`} · Slot #{withdrawal.withdrawalId}
                                  </p>
                                  <p className="text-xs text-slate-400">Amount: {formatted.amount}</p>
                                </div>
                                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                  Available in epoch {formatted.withdrawEpoch}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {action === 'compound' && (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div>
                <h2 className="text-xl font-semibold text-blue-200">Compound rewards</h2>
                <p className="text-sm text-slate-400">
                  Restake your unclaimed rewards for the selected validator.
                </p>
              </div>

              <button
                onClick={() => handleCompound(sdk!, validatorBig, account!, updateState)}
                disabled={!sdk || !account || validatorBig <= 0n || state.busy}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state.busy ? 'Processing…' : 'Compound rewards'}
              </button>
            </div>
          )}

          {action === 'claim' && (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div>
                <h2 className="text-xl font-semibold text-purple-200">Claim rewards</h2>
                <p className="text-sm text-slate-400">
                  Claim rewards from the selected validator to your wallet.
                </p>
              </div>

              <button
                onClick={() => handleClaimRewards(sdk!, validatorBig, account!, updateState)}
                disabled={!sdk || !account || validatorBig <= 0n || state.busy}
                className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state.busy ? 'Processing…' : 'Claim rewards'}
              </button>
            </div>
          )}
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
