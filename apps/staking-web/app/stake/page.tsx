'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import type { MonadNetwork } from '@monad-staking/config';
import { ClientOnly } from '@/app/components/client-only';
import { TransactionResult } from '@/app/components/transaction-result';
import { StakingModal } from '@/app/stake/components/staking-modal';
import { TokenPriceCard } from '@/app/stake/components/token-price-card';
import { StakingStatsCard } from '@/app/stake/components/staking-stats-card';
import { UserPortfolio } from '@/app/stake/components/user-portfolio';
import { StakingChart } from '@/app/stake/components/staking-chart';
import { QuickActions } from '@/app/stake/components/quick-actions';
import { WithdrawModal } from '@/app/stake/components/withdraw-modal';
import { getNetworkConfigMap, getEnabledNetworkConfigs, tryResolveNetwork } from '@/lib/networks';
import { parseNetworkKey } from '@/lib/validators';
import { useStakingSdk } from '@/hooks/useStakingSdk';
import { useStakeActions } from '@/hooks/useStakeActions';
import { useStakingData } from '@/hooks/useStakingData';
import { useValidatorsQuery } from '@/lib/queries';
import { formatMonFromWei, getNextAvailableWithdrawId } from '@/lib/utils';
import { useGasEstimation } from '@/hooks/useGasEstimation';
import { parseEther, formatEther } from 'viem';
import type { ValidatorSummary } from '@/lib/api/models';
import { ShellSection } from '@/app/components/layout/shell';
import { Badge } from '@/app/components/ui/badge';
import { CoinPixelIcon } from '@/app/components/icons';

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
  const { calculateMaxStakeable, estimating } = useGasEstimation({ sdk, account });

  const { state, delegate, undelegate, withdraw, claimAllRewards, resetState } =
    useStakeActions({
      sdk,
      account,
      onSettled: () => data.refetchAll(),
    });

  const [delegateModal, setDelegateModal] = useState<{ 
    validatorId: string | null; 
    amount: string;
    maxStakeable: bigint | null;
    gasEstimate: string | null;
  }>({ 
    validatorId: null, 
    amount: '',
    maxStakeable: null,
    gasEstimate: null,
  });
  const [undelegateModal, setUndelegateModal] = useState<{
    validatorId: string | null;
    amount: string;
    withdrawalId: number | null;
    maxStakeable: bigint | null;
  }>({ validatorId: null, amount: '', withdrawalId: null, maxStakeable: null });
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectorActiveOnly, setSelectorActiveOnly] = useState(true);
  const [selectorCursor, setSelectorCursor] = useState('');
  const [selectorItems, setSelectorItems] = useState<ValidatorSummary[]>([]);
  const [selectorHasMore, setSelectorHasMore] = useState(false);
  const [selectorNextCursor, setSelectorNextCursor] = useState<string | null>(null);

  const { validators, delegations, withdrawals, epoch, balance } = data;

  const delegateModalOpen = delegateModal.validatorId !== null;

  const selectorQuery = useValidatorsQuery(selectedNetwork ?? 'monad-mainnet', selectorCursor, 300, {
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
  const statsFormatter = new Intl.NumberFormat('en-US', { 
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
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
      change: `${readyWithdrawals.length} ready`,
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

  const openDelegateModal = async (validatorId: string | null = null) => {
    const initial = validatorId ? validatorMap.get(validatorId) : undefined;
    setSelectorActiveOnly(true);
    setSelectorCursor('');
    setSelectorNextCursor(null);
    setSelectorHasMore(false);
    setSelectorItems(initial ? [initial] : []);
    
    // Calculate max stakeable amount considering gas
    let maxStakeable: bigint | null = null;
    if (validatorId && balance && account) {
      const balanceWei = parseEther(balance.decimal);
      maxStakeable = await calculateMaxStakeable(validatorId, balanceWei);
    }
    
    setDelegateModal({ 
      validatorId: validatorId ?? '', 
      amount: '',
      maxStakeable,
      gasEstimate: null,
    });
  };

  const openUndelegateModal = (validatorId: string) => {
    const used = withdrawalsByValidator.get(validatorId) ?? [];
    const delegationEntry = delegations.find((item) => item.validatorId === validatorId);
    const maxAmount = delegationEntry ? parseEther(sanitizeAmount(delegationEntry.stake.formatted)) : null;
    setUndelegateModal({
      validatorId,
      amount: '',
      withdrawalId: getNextAvailableWithdrawId(used),
      maxStakeable: maxAmount,
    });
  };

  const closeModals = (reset = true) => {
    setDelegateModal({ validatorId: null, amount: '', maxStakeable: null, gasEstimate: null });
    setUndelegateModal({ validatorId: null, amount: '', withdrawalId: null, maxStakeable: null });
    setWithdrawModalOpen(false);
    setSelectorCursor('');
    setSelectorNextCursor(null);
    setSelectorHasMore(false);
    setSelectorItems([]);
    setSelectorActiveOnly(true);
    if (reset) resetState();
  };

  const handleCalculateMaxDelegate = async () => {
    if (!delegateModal.validatorId || !balance || !account) return;
    const balanceWei = parseEther(balance.decimal);
    const maxStakeable = await calculateMaxStakeable(delegateModal.validatorId, balanceWei);
    setDelegateModal((prev) => ({ 
      ...prev, 
      maxStakeable,
      gasEstimate: maxStakeable ? formatEther(balanceWei - maxStakeable) : null,
    }));
  };

  const handleCalculateMaxUndelegate = async () => {
    if (!undelegateModal.validatorId) return;
    const delegation = delegations.find(d => d.validatorId === undelegateModal.validatorId);
    if (!delegation) return;
    const maxAmount = parseEther(sanitizeAmount(delegation.stake.formatted));
    setUndelegateModal((prev) => ({ ...prev, maxStakeable: maxAmount }));
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

  const handleWithdrawSelected = async (withdrawals: typeof readyWithdrawals) => {
    if (!sdk || !account) return;
    
    // Process withdrawals sequentially
    for (const withdrawal of withdrawals) {
      await withdraw(withdrawal.validatorId, withdrawal.withdrawalId);
    }
    
    // Close modal after all withdrawals
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
    setWithdrawModalOpen(true);
  };
  const handleClaim = () => {
    if (!sdk || !account) return;
    void claimAllRewards();
  };

  return (
    <>
      <ShellSection as="div" className="space-y-8" width="wide">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center border-2 border-primary bg-[#12092f] shadow-[4px_4px_0_rgba(0,0,0,0.55)]">
                <CoinPixelIcon size={20} className="animate-coin-drop text-primary" />
              </span>
              <div className="flex flex-col gap-1">
                <h1 className="font-display text-3xl uppercase tracking-[0.14em] text-primary">Stake HQ</h1>
                <p className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-base">
                  Manage delegations, rewards, and withdrawals with the retro command console.
                </p>
              </div>
            </div>
            {resolved ? <Badge variant="accent">{resolved.label}</Badge> : null}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <TokenPriceCard tokenSymbol="MON" priceUsd={null} priceChangeLabel={epoch ? `Epoch ${epoch.epoch}` : undefined} />
            </div>
            <div className="lg:col-span-2">
              <StakingStatsCard stats={stats} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
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
              isConnected={!!account}
            />
          </div>

          <div className="flex flex-col gap-5">
            <UserPortfolio
              staked={formattedMon(totals.staked)}
              withdrawable={formattedMon(totals.readyWithdraw)}
              claimable={formattedMon(totals.rewards)}
              unstaked={formattedMon(totals.pendingWithdraw)}
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
        txContext={state.txContext}
        validatorName={state.txContext?.validatorId ? validatorMap.get(state.txContext.validatorId)?.meta?.name : undefined}
      />

      <StakingModal
        open={delegateModal.validatorId !== null}
        mode="stake"
        validatorOptions={selectorOptions}
        selectedValidatorId={delegateModal.validatorId}
        onValidatorChange={(next) => setDelegateModal((prev) => ({ ...prev, validatorId: next }))}
        amount={delegateModal.amount}
        onAmountChange={(next) => setDelegateModal((prev) => ({ ...prev, amount: next }))}
        maxAmount={delegateModal.maxStakeable}
        gasEstimate={delegateModal.gasEstimate}
        isEstimating={estimating}
        onCalculateMax={handleCalculateMaxDelegate}
        onSubmit={handleDelegateSubmit}
        onClose={() => closeModals()}
        disabled={!sdk || !account || state.busy}
        loading={selectorQuery.isFetching && selectorItems.length === 0}
        hasMore={selectorHasMore}
        onLoadMore={() => selectorNextCursor && setSelectorCursor(selectorNextCursor)}
        loadingMore={selectorQuery.isFetching && selectorItems.length > 0}
        availableBalance={formattedMon(totals.available)}
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

      <StakingModal
        open={undelegateModal.validatorId !== null}
        mode="unstake"
        validatorOptions={delegatedOptions}
        selectedValidatorId={undelegateModal.validatorId}
        onValidatorChange={(next) => {
          const used = withdrawalsByValidator.get(next) ?? [];
          const delegationEntry = delegations.find((item) => item.validatorId === next);
          const maxAmount = delegationEntry ? parseEther(sanitizeAmount(delegationEntry.stake.formatted)) : null;
          setUndelegateModal({
            validatorId: next,
            amount: '',
            withdrawalId: getNextAvailableWithdrawId(used),
            maxStakeable: maxAmount,
          });
        }}
        amount={undelegateModal.amount}
        onAmountChange={(next) => setUndelegateModal((prev) => ({ ...prev, amount: next }))}
        maxAmount={undelegateModal.maxStakeable}
        gasEstimate={null}
        isEstimating={false}
        onCalculateMax={handleCalculateMaxUndelegate}
        onSubmit={handleUndelegateSubmit}
        onClose={() => closeModals()}
        disabled={!sdk || !account || state.busy}
        loading={delegations.length === 0 && data.isLoading.delegations}
        availableBalance={undelegateModal.validatorId ? (() => {
          const delegation = delegations.find(d => d.validatorId === undelegateModal.validatorId);
          return delegation ? delegation.stake.formatted : '0 MON';
        })() : undefined}
        additionalInfo={
          undelegateModal.withdrawalId !== null ? (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs">
              <p className="text-muted-foreground">
                Withdrawal slot <span className="font-semibold text-primary">#{undelegateModal.withdrawalId}</span> will be used for this request.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-400">
              <p>
                All withdrawal slots for this validator are in use. Complete an existing withdrawal first.
              </p>
            </div>
          )
        }
      />

      <WithdrawModal
        open={withdrawModalOpen}
        onClose={() => closeModals()}
        readyWithdrawals={readyWithdrawals}
        pendingWithdrawals={pendingWithdrawals}
        onWithdrawSelected={handleWithdrawSelected}
        busy={state.busy}
      />
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
