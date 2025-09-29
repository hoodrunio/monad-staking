'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import type { MonadNetwork } from '@monad-staking/config';
import { ClientOnly } from '@/app/components/client-only';
import { TransactionResult } from '@/app/components/transaction-result';
import { ValidatorSelector } from '@/app/components/validator-selector';
import { ActionModal } from '@/app/stake/components/action-modal';
import { TokenPriceCard } from '@/app/stake/components/token-price-card';
import { StakingStatsCard } from '@/app/stake/components/staking-stats-card';
import { UserPortfolio } from '@/app/stake/components/user-portfolio';
import { StakingChart } from '@/app/stake/components/staking-chart';
import { QuickActions } from '@/app/stake/components/quick-actions';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { parseNetworkKey } from '@/lib/validators';
import { useStakingSdk } from '@/hooks/useStakingSdk';
import { useStakeActions } from '@/hooks/useStakeActions';
import { useStakingData } from '@/hooks/useStakingData';
import { useValidatorsQuery } from '@/lib/queries';
import { formatMonFromWei, getNextAvailableWithdrawId } from '@/lib/utils';
import type { ValidatorSummary } from '@/lib/api/models';
import { ShellSection } from '@/app/components/layout/shell';

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

  const { state, delegate, undelegate, withdraw, claimAllRewards, resetState } =
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

  const { validators, delegations, withdrawals, epoch, balance } = data;
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
        { label: 'Flags', value: validator.flagsRaw || 'None' },
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
    const rewards = delegations.reduce((sum, item) => sum + Number(item.unclaimedRewards.decimal || 0), 0);
    const ready = readyWithdrawals.reduce((sum, item) => sum + Number(item.amount.decimal || 0), 0);
    const pending = pendingWithdrawals.reduce((sum, item) => sum + Number(item.amount.decimal || 0), 0);

    // Use balance API data directly
    const available = balance ? Number(balance.decimal || 0) : 0;
    const staked = balance ? Number(balance.stakedDecimal || 0) : delegations.reduce((sum, item) => sum + Number(item.stake.decimal || 0), 0);

    return { staked, rewards, readyWithdraw: ready, pendingWithdraw: pending, available };
  }, [delegations, readyWithdrawals, pendingWithdrawals, balance]);

  const activeValidators = validators.filter((validator) => validator.isActive).length;
  const statsFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  const stats = [
    {
      label: 'Total staked',
      value: `${statsFormatter.format(totals.staked)} MON`,
      change: `+${statsFormatter.format(totals.rewards)} rewards`,
      trend: 'up' as const,
    },
    {
      label: 'Validators',
      value: validators.length.toString(),
      change: `${activeValidators} active`,
      trend: activeValidators > 0 ? ('up' as const) : ('down' as const),
    },
    {
      label: 'Delegations',
      value: delegations.length.toString(),
      change: `${readyWithdrawals.length} ready withdrawals`,
      trend: readyWithdrawals.length > 0 ? ('up' as const) : ('down' as const),
    },
    {
      label: 'Pending withdraw',
      value: pendingWithdrawals.length.toString(),
      change: `${statsFormatter.format(totals.pendingWithdraw)} MON`,
      trend: pendingWithdrawals.length > 0 ? ('down' as const) : ('up' as const),
    },
  ];

  const firstDelegation = delegations[0] ?? null;
  const firstReadyWithdrawal = readyWithdrawals[0] ?? null;

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

  if (!selectedNetwork || !resolved) {
    return <LoadingFallback />;
  }

  const formattedMon = (value: number) => `${statsFormatter.format(value)} MON`;
  const apyLabel = 'Coming soon';
  const canStake = !!sdk && !!account && !state.busy;
  const canUnstake = Boolean(firstDelegation) && !!sdk && !!account && !state.busy;
  const canWithdraw = Boolean(firstReadyWithdrawal) && !!sdk && !!account && !state.busy;
  const canClaim = totals.rewards > 0 && !!account && !!sdk && !state.busy;

  const handleStake = () => openDelegateModal(null);
  const handleUnstake = () => {
    if (!firstDelegation) return;
    openUndelegateModal(firstDelegation.validatorId);
  };
  const handleWithdraw = () => {
    if (!firstReadyWithdrawal) return;
    setWithdrawModal(firstReadyWithdrawal.withdrawalId);
  };
  const handleClaim = () => {
    if (!sdk || !account) return;
    void claimAllRewards();
  };

  return (
    <>
      <ShellSection as="div" className="space-y-8" width="wide">
        <div className="space-y-6">
          <div>
            <h1 className="mb-2 text-balance text-4xl font-bold">Stake</h1>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <TokenPriceCard tokenSymbol="MON" priceUsd={null} priceChangeLabel={epoch ? `Epoch ${epoch.epoch}` : undefined} />
            </div>
            <div className="lg:col-span-2">
              <StakingStatsCard stats={stats} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <QuickActions
              stakedValue={formattedMon(totals.staked)}
              rewardsValue={formattedMon(totals.rewards)}
              availableBalance={formattedMon(totals.available)}
              apyLabel={apyLabel}
              onStake={handleStake}
              onUnstake={handleUnstake}
              onWithdraw={handleWithdraw}
              onClaim={handleClaim}
              canStake={canStake}
              canUnstake={canUnstake}
              canWithdraw={canWithdraw}
              canClaim={canClaim}
              busyAction={state.busyAction}
            />
          </div>

          <div className="flex flex-col gap-4">
            <UserPortfolio
              staked={formattedMon(totals.staked)}
              withdrawable={formattedMon(totals.readyWithdraw)}
              claimable={formattedMon(totals.rewards)}
              unstaked={formattedMon(totals.pendingWithdraw)}
              apyLabel={apyLabel}
            >
              <div className="flex-1">
                <StakingChart />
              </div>
            </UserPortfolio>
          </div>
        </div>
      </ShellSection>

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
              <label className="flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/40 focus:ring-offset-0"
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
          <div className="space-y-2">
            <Label htmlFor="delegate-amount" className="text-sm text-muted-foreground">
              Amount (MON)
            </Label>
            <Input
              id="delegate-amount"
              type="text"
              value={delegateModal.amount}
              onChange={(event) => setDelegateModal((prev) => ({ ...prev, amount: event.target.value }))}
              placeholder="0.0"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => closeModals()}>
              Cancel
            </Button>
            <Button onClick={handleDelegateSubmit} disabled={!delegateModal.validatorId || !delegateModal.amount}>
              Delegate
            </Button>
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
          <div className="space-y-2">
            <Label htmlFor="undelegate-amount" className="text-sm text-muted-foreground">
              Amount (MON)
            </Label>
            <Input
              id="undelegate-amount"
              type="text"
              value={undelegateModal.amount}
              onChange={(event) => setUndelegateModal((prev) => ({ ...prev, amount: event.target.value }))}
              placeholder="0.0"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
            {undelegateModal.withdrawalId !== null ? (
              <p>
                Withdrawal slot <span className="font-semibold text-primary">#{undelegateModal.withdrawalId}</span> will be used for this request.
              </p>
            ) : (
              <p className="text-amber-200">
                All withdrawal slots for this validator are in use. Complete or cancel an existing withdrawal first.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => closeModals()}>
              Cancel
            </Button>
            <Button
              className="bg-amber-400 text-slate-900 hover:bg-amber-300"
              onClick={handleUndelegateSubmit}
              disabled={!undelegateModal.validatorId || !undelegateModal.amount || undelegateModal.withdrawalId === null}
            >
              Undelegate
            </Button>
          </div>
        </div>
      </ActionModal>

      <ActionModal
        open={withdrawModal !== null}
        onClose={() => closeModals()}
        title="Withdraw request"
        description="Confirm withdrawal of the selected slot."
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          {withdrawModal !== null ? (
            <div>
              <p className="font-medium text-foreground">Validator {withdrawEntry?.validatorId ?? '-'}</p>
              <p className="text-xs text-muted-foreground">Slot #{withdrawModal}</p>
              {withdrawEntry ? <p className="mt-2 text-muted-foreground">Amount {withdrawEntry.amount.formatted}</p> : null}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => closeModals()}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (withdrawModal === null) return;
                void handleWithdrawSubmit(withdrawModal);
              }}
            >
              Withdraw
            </Button>
          </div>
        </div>
      </ActionModal>
    </>
  );
}

function LoadingFallback() {
  return (
    <ShellSection as="div" className="space-y-6" width="wide">
      <div className="h-12 w-2/3 rounded-2xl bg-white/10" />
      <div className="h-48 rounded-3xl border border-white/10 bg-white/5" />
      <div className="h-64 rounded-3xl border border-white/10 bg-white/5" />
    </ShellSection>
  );
}
