'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import type { MonadNetwork } from '@monad-staking/config';
import { NetworkSelector } from '@/app/components/network-selector';
import { ClientOnly } from '@/app/components/client-only';
import { TransactionResult } from '@/app/components/transaction-result';
import { ValidatorSelector } from '@/app/components/validator-selector';
import { PortfolioSummary } from '@/app/stake/components/portfolio-summary';
import { DelegationCard } from '@/app/stake/components/delegation-card';
import { WithdrawalsList } from '@/app/stake/components/withdrawals-list';
import { ActionModal } from '@/app/stake/components/action-modal';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { parseNetworkKey } from '@/lib/validators';
import { useStakingSdk } from '@/hooks/useStakingSdk';
import { useStakeActions } from '@/hooks/useStakeActions';
import { useStakingData } from '@/hooks/useStakingData';
import { useValidatorsQuery } from '@/lib/queries';
import { formatMonFromWei, getNextAvailableWithdrawId } from '@/lib/utils';
import type { ValidatorSummary } from '@/lib/api/models';

export default function StakePage() {
  return (
    <ClientOnly fallback={<LoadingFallback />}>
      <StakeScreen />
    </ClientOnly>
  );
}

function sanitizeAmount(value: string): string {
  return value.replace(/[^0-9.]/g, '');
}

function StakeScreen() {
  const configMap = useMemo(() => getNetworkConfigMap(), []);
  const enabledNetworks = useMemo(() => getEnabledNetworkConfigs(configMap), [configMap]);
  const searchParams = useSearchParams();

  const networkParam = searchParams.get('network') ?? undefined;
  const requestedNetwork = parseNetworkKey(networkParam);
  const selectedNetwork = (requestedNetwork ?? enabledNetworks[0]?.key) as MonadNetwork | undefined;
  const resolved = selectedNetwork ? tryResolveNetwork(configMap, selectedNetwork) : null;

  const sdk = useStakingSdk(resolved);
  const { address } = useAccount();
  const account = address as `0x${string}` | undefined;

  const data = useStakingData(selectedNetwork, !!selectedNetwork && !!resolved);

  const { state, delegate, undelegate, withdraw, compound, claimRewards, claimAllRewards, resetState } =
    useStakeActions({
      sdk,
      account,
      onSettled: () => data.refetchAll(),
    });

  const [delegateModal, setDelegateModal] = useState<{ validatorId: string | null; amount: string }>({ validatorId: null, amount: '' });
  const [undelegateModal, setUndelegateModal] = useState<{
    validatorId: string | null;
    amount: string;
    withdrawalId: number | null;
  }>({ validatorId: null, amount: '', withdrawalId: null });
  const [withdrawModal, setWithdrawModal] = useState<number | null>(null);
  const [selectorActiveOnly, setSelectorActiveOnly] = useState(true);
  const [selectorCursor, setSelectorCursor] = useState('');
  const [selectorItems, setSelectorItems] = useState<ValidatorSummary[]>([]);
  const [selectorHasMore, setSelectorHasMore] = useState(false);
  const [selectorNextCursor, setSelectorNextCursor] = useState<string | null>(null);

  const { validators, delegations, withdrawals, epoch } = data;
  const withdrawEntry = useMemo(
    () => (withdrawModal !== null ? withdrawals.find((item) => item.withdrawalId === withdrawModal) ?? null : null),
    [withdrawModal, withdrawals],
  );

  const delegateModalOpen = delegateModal.validatorId !== null;

  const selectorQuery = useValidatorsQuery(selectedNetwork ?? 'monad-mainnet', selectorCursor, 50, {
    enabled: delegateModalOpen,
    filters: { activeOnly: selectorActiveOnly },
  });

  useEffect(() => {
    if (!delegateModalOpen) return;
    const response = selectorQuery.data;
    if (!response) return;
    setSelectorHasMore(Boolean(response.cursor.next));
    setSelectorNextCursor(response.cursor.next ?? null);

    const base = new Map(selectorItems.map((item) => [item.validatorId, item]));
    response.items.forEach((item) => base.set(item.validatorId, item));
    const list = Array.from(base.values());

    setSelectorItems((prev) => {
      if (prev.length === list.length && prev.every((item, index) => item.validatorId === list[index]?.validatorId)) {
        return prev;
      }
      return list;
    });

    if (
      list.length > 0 &&
      (!delegateModal.validatorId || !list.some((item) => item.validatorId === delegateModal.validatorId))
    ) {
      setDelegateModal((prevModal) => ({ ...prevModal, validatorId: list[0].validatorId }));
    }
  }, [delegateModalOpen, selectorQuery.data, selectorItems, delegateModal.validatorId]);

  const validatorMap = useMemo(() => new Map(validators.map((item) => [item.validatorId, item])), [validators]);

  const selectorOptions = useMemo(() => {
    return selectorItems.map((validator) => ({
      value: validator.validatorId,
      title: validator.meta?.name ?? `Validator ${validator.validatorId}`,
      subtitle: `${validator.commission.formatted} commission • Stake ${validator.stake.formatted}`,
      stats: [
        { label: 'Rewards', value: validator.unclaimedRewards.formatted },
        { label: 'Flags', value: validator.flagsRaw || '—' },
      ],
      badge: validator.isActive ? 'Active' : undefined,
    }));
  }, [selectorItems]);

  const delegatedOptions = useMemo(() => {
    return delegations.map((delegation) => {
      const validator = validatorMap.get(delegation.validatorId);
      return {
        value: delegation.validatorId,
        title: validator?.meta?.name ?? `Validator ${delegation.validatorId}`,
        subtitle: `Stake ${delegation.stake.formatted}`,
        stats: [
          { label: 'Rewards', value: delegation.unclaimedRewards.formatted },
          {
            label: 'Pending',
            value:
              delegation.deltaStakeRaw === '0'
                ? '0 MON'
                : formatMonFromWei(delegation.deltaStakeRaw),
          },
        ],
        badge: validator?.isActive ? 'Active' : undefined,
      };
    });
  }, [delegations, validatorMap]);

  const withdrawalsByValidator = useMemo(() => {
    const map = new Map<string, number[]>();
    withdrawals.forEach((entry) => {
      const list = map.get(entry.validatorId) ?? [];
      list.push(entry.withdrawalId);
      map.set(entry.validatorId, list);
    });
    return map;
  }, [withdrawals]);

  const readyWithdrawals = useMemo(() => {
    const currentEpoch = epoch ? BigInt(epoch.epoch) : null;
    if (!currentEpoch) return [] as typeof withdrawals;
    return withdrawals.filter((withdrawal) => BigInt(withdrawal.withdrawEpoch) < currentEpoch);
  }, [withdrawals, epoch]);

  const pendingWithdrawals = useMemo(() => {
    const currentEpoch = epoch ? BigInt(epoch.epoch) : null;
    if (!currentEpoch) return withdrawals;
    return withdrawals.filter((withdrawal) => BigInt(withdrawal.withdrawEpoch) >= currentEpoch);
  }, [withdrawals, epoch]);

  const totals = useMemo(() => {
    const staked = delegations.reduce((sum, item) => sum + Number(item.stake.decimal || 0), 0);
    const rewards = delegations.reduce((sum, item) => sum + Number(item.unclaimedRewards.decimal || 0), 0);
    const ready = readyWithdrawals.reduce((sum, item) => sum + Number(item.amount.decimal || 0), 0);
    const pending = pendingWithdrawals.reduce((sum, item) => sum + Number(item.amount.decimal || 0), 0);
    return { staked, rewards, readyWithdraw: ready, pendingWithdraw: pending };
  }, [delegations, readyWithdrawals, pendingWithdrawals]);

  const canClaimAll = totals.rewards > 0 && !state.busy && !!account && !!sdk;

  if (!selectedNetwork || !resolved) {
    return <LoadingFallback />;
  }

  const openDelegateModal = (validatorId: string | null = null) => {
    const initial = validatorId ? validatorMap.get(validatorId) : undefined;
    setSelectorActiveOnly(true);
    setSelectorCursor('');
    setSelectorNextCursor(null);
    setSelectorHasMore(false);
    setSelectorItems(initial ? [initial] : []);
    setDelegateModal({ validatorId: validatorId ?? '', amount: '' });
  };

  const openUndelegateModal = (validatorId: string) => {
    const used = withdrawalsByValidator.get(validatorId) ?? [];
    const delegationEntry = delegations.find((item) => item.validatorId === validatorId);
    setUndelegateModal({
      validatorId,
      amount: delegationEntry ? sanitizeAmount(delegationEntry.stake.formatted) : '',
      withdrawalId: getNextAvailableWithdrawId(used),
    });
  };

  const closeModals = (reset = true) => {
    setDelegateModal({ validatorId: null, amount: '' });
    setUndelegateModal({ validatorId: null, amount: '', withdrawalId: null });
    setWithdrawModal(null);
    setSelectorCursor('');
    setSelectorNextCursor(null);
    setSelectorHasMore(false);
    setSelectorItems([]);
    setSelectorActiveOnly(true);
    if (reset) resetState();
  };

  const handleDelegateSubmit = async () => {
    if (!delegateModal.validatorId || !delegateModal.amount || !sdk || !account) return;
    await delegate(delegateModal.validatorId, delegateModal.amount);
    closeModals(false);
  };

  const handleUndelegateSubmit = async () => {
    if (!undelegateModal.validatorId || !undelegateModal.amount || undelegateModal.withdrawalId == null || !sdk || !account)
      return;
    await undelegate(undelegateModal.validatorId, undelegateModal.amount, undelegateModal.withdrawalId);
    closeModals(false);
  };

  const handleWithdrawSubmit = async (withdrawal: number) => {
    const target = withdrawals.find((item) => item.withdrawalId === withdrawal);
    if (!target || !sdk || !account) return;
    await withdraw(target.validatorId, target.withdrawalId);
    closeModals(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-400">Staking dashboard</p>
          <h1 className="text-4xl font-semibold text-white">Stake MON</h1>
          <p className="text-slate-400">Manage your delegations, rewards, and withdrawals on {resolved.label}.</p>
        </div>
        <NetworkSelector networks={enabledNetworks} selectedKey={selectedNetwork} />
      </header>

      <PortfolioSummary
        totals={{
          staked: totals.staked,
          rewards: totals.rewards,
          pendingWithdraw: totals.pendingWithdraw,
          readyWithdraw: totals.readyWithdraw,
        }}
        onClaimAll={() => {
          if (!sdk || !account) return;
          void claimAllRewards();
        }}
        onStake={() => openDelegateModal(null)}
        claiming={state.busy && state.busyAction === 'claim-all'}
        canClaim={canClaimAll}
        stakeDisabled={!sdk || !account || state.busy}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-100">My delegations</h2>
          <p className="text-sm text-slate-500">Manage existing positions, compound rewards, or start undelegation.</p>
        </div>
        {data.isLoading.delegations ? (
          <DelegationsSkeleton />
        ) : delegations.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-300">
            You have no active delegations yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {delegations.map((delegation) => (
              <DelegationCard
                key={delegation.validatorId}
                delegation={delegation}
                validator={validatorMap.get(delegation.validatorId)}
                onUndelegate={(entry) => openUndelegateModal(entry.validatorId)}
                onClaim={async (entry) => {
                  if (!sdk || !account) return;
                  await claimRewards(entry.validatorId);
                  data.refetchAll();
                }}
                onCompound={async (entry) => {
                  if (!sdk || !account) return;
                  await compound(entry.validatorId);
                  data.refetchAll();
                }}
                busyAction={state.busyAction}
                disabled={!sdk || !account || state.busy}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-100">Withdrawals</h2>
          <p className="text-sm text-slate-500">Track slots that are ready or still pending.</p>
        </div>
        {data.isLoading.withdrawals ? (
          <WithdrawalsSkeleton />
        ) : (
          <WithdrawalsList
            ready={readyWithdrawals}
            pending={pendingWithdrawals}
            busy={!sdk || !account || (state.busy && state.busyAction === 'withdraw')}
            onWithdraw={(entry) => setWithdrawModal(entry.withdrawalId)}
          />
        )}
      </section>

      <TransactionResult
        txHash={state.txHash}
        txError={state.txError}
        networkConfig={resolved}
        open={state.txStage !== 'idle' && state.txStage !== 'pending'}
        onClose={resetState}
        stage={state.txStage}
        txCount={state.txCount}
      />

      <ActionModal
        open={delegateModal.validatorId !== null}
        onClose={() => closeModals()}
        title="Delegate stake"
        description="Choose the amount of MON you would like to delegate."
      >
        <div className="space-y-4">
          <ValidatorSelector
            value={delegateModal.validatorId ?? ''}
            onChange={(next) => setDelegateModal((prev) => ({ ...prev, validatorId: next }))}
            options={selectorOptions}
            loading={selectorQuery.isFetching && selectorItems.length === 0}
            emptyMessage="No validators available"
            hasMore={selectorHasMore}
            onLoadMore={() => selectorNextCursor && setSelectorCursor(selectorNextCursor)}
            loadingMore={selectorQuery.isFetching && selectorItems.length > 0}
            disabled={!sdk || !account || state.busy}
            toolbar={
              <label className="flex items-center gap-2 text-slate-400">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={selectorActiveOnly}
                  onChange={(event) => {
                    const next = event.target.checked;
                    const initial = delegateModal.validatorId ? validatorMap.get(delegateModal.validatorId) : undefined;
                    setSelectorActiveOnly(next);
                    setSelectorCursor('');
                    setSelectorNextCursor(null);
                    setSelectorHasMore(false);
                    setSelectorItems(initial ? [initial] : []);
                  }}
                  disabled={!sdk || !account || state.busy}
                />
                Active only
              </label>
            }
          />
          <label className="block text-sm text-slate-300">
            Amount (MON)
            <input
              type="text"
              value={delegateModal.amount}
              onChange={(event) => setDelegateModal((prev) => ({ ...prev, amount: event.target.value }))}
              placeholder="0.0"
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => closeModals()}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelegateSubmit}
              disabled={!delegateModal.validatorId || !delegateModal.amount}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              Delegate
            </button>
          </div>
        </div>
      </ActionModal>

      <ActionModal
        open={undelegateModal.validatorId !== null}
        onClose={() => closeModals()}
        title="Start undelegation"
        description="Select the amount to undelegate. A withdrawal slot will be reserved for this request."
      >
        <div className="space-y-4">
          <ValidatorSelector
            value={undelegateModal.validatorId ?? ''}
            onChange={(next) => {
              const used = withdrawalsByValidator.get(next) ?? [];
              const delegationEntry = delegations.find((item) => item.validatorId === next);
              setUndelegateModal({
                validatorId: next,
                amount: delegationEntry ? sanitizeAmount(delegationEntry.stake.formatted) : '',
                withdrawalId: getNextAvailableWithdrawId(used),
              });
            }}
            options={delegatedOptions}
            loading={delegations.length === 0 && data.isLoading.delegations}
            emptyMessage="No active delegations"
            disabled={!sdk || !account || state.busy}
          />
          <label className="block text-sm text-slate-300">
            Amount (MON)
            <input
              type="text"
              value={undelegateModal.amount}
              onChange={(event) => setUndelegateModal((prev) => ({ ...prev, amount: event.target.value }))}
              placeholder="0.0"
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
            {undelegateModal.withdrawalId !== null ? (
              <p>
                Withdrawal slot <span className="font-semibold text-emerald-300">#{undelegateModal.withdrawalId}</span> will be used for this request.
              </p>
            ) : (
              <p className="text-amber-300">
                All withdrawal slots for this validator are in use. Complete or cancel an existing withdrawal first.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => closeModals()}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUndelegateSubmit}
              disabled={!undelegateModal.validatorId || !undelegateModal.amount || undelegateModal.withdrawalId === null}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              Undelegate
            </button>
          </div>
        </div>
      </ActionModal>

      <ActionModal
        open={withdrawModal !== null}
        onClose={() => closeModals()}
        title="Withdraw request"
        description="Confirm withdrawal of the selected slot."
        size="sm"
      >
        <div className="space-y-4 text-sm text-slate-300">
          {withdrawModal !== null && (
            <div>
              <p className="font-medium text-slate-200">Validator {withdrawEntry?.validatorId ?? '—'}</p>
              <p className="text-xs text-slate-500">Slot #{withdrawModal}</p>
              {withdrawEntry && (
                <p className="mt-2 text-slate-300">Amount {withdrawEntry.amount.formatted}</p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => closeModals()}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (withdrawModal === null) return;
                void handleWithdrawSubmit(withdrawModal);
              }}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Withdraw
            </button>
          </div>
        </div>
      </ActionModal>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-2/3 rounded bg-slate-800" />
      <div className="h-48 rounded-xl bg-slate-900/60" />
      <div className="h-64 rounded-xl bg-slate-900/60" />
    </div>
  );
}

function DelegationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/60" />
      ))}
    </div>
  );
}

function WithdrawalsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/60" />
      ))}
    </div>
  );
}
