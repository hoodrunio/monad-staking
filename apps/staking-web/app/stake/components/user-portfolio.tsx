'use client';

import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GiftIcon,
  WalletIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';

interface UserPortfolioProps {
  readonly staked: string;
  readonly locked: string;
  readonly unstaked: string;
  readonly rewards: string;
  readonly apyLabel: string;
  readonly onStake: () => void;
  readonly onUnstake: () => void;
  readonly onWithdraw: () => void;
  readonly onClaim: () => void;
  readonly canStake: boolean;
  readonly canUnstake: boolean;
  readonly canWithdraw: boolean;
  readonly canClaim: boolean;
  readonly busyAction?: string | null;
}

export function UserPortfolio({
  staked,
  locked,
  unstaked,
  rewards,
  apyLabel,
  onStake,
  onUnstake,
  onWithdraw,
  onClaim,
  canStake,
  canUnstake,
  canWithdraw,
  canClaim,
  busyAction,
}: UserPortfolioProps) {
  return (
    <div className="space-y-8 rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
          Quick Actions
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
          Ready to stake
        </span>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <ActionButton
          icon={ArrowTrendingUpIcon}
          label={busyAction === 'stake' ? 'Opening…' : 'Stake MON'}
          onClick={onStake}
          disabled={!canStake}
          tone="primary"
        />
        <ActionButton
          icon={ArrowTrendingDownIcon}
          label={busyAction === 'unstake' ? 'Processing…' : 'Unstake'}
          onClick={onUnstake}
          disabled={!canUnstake}
        />
        <ActionButton
          icon={GiftIcon}
          label={busyAction === 'claim' ? 'Claiming…' : 'Claim rewards'}
          onClick={onClaim}
          disabled={!canClaim}
        />
        <ActionButton
          icon={WalletIcon}
          label={busyAction === 'withdraw' ? 'Withdrawing…' : 'Withdraw'}
          onClick={onWithdraw}
          disabled={!canWithdraw}
        />
      </div>

      <div className="rounded-2xl border border-border/50 bg-secondary/40 p-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <ExclamationCircleIcon className="h-4 w-4" />
          Stake MON to earn protocol rewards and participate in validator growth.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PortfolioStat label="Staked" value={staked} tone="primary" />
        <PortfolioStat label="Locked" value={locked} />
        <PortfolioStat label="Unstaked" value={unstaked} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PortfolioStat label="Rewards" value={rewards} tone="accent" />
        <PortfolioStat label="APY" value={apyLabel} />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  readonly icon: typeof ArrowTrendingUpIcon;
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly tone?: 'primary';
}

function ActionButton({ icon: Icon, label, onClick, disabled, tone }: ActionButtonProps) {
  const base =
    'flex h-12 items-center justify-center gap-2 rounded-xl border border-border/60 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50';
  const styles = tone === 'primary'
    ? 'bg-primary text-primary-foreground shadow-[0_20px_45px_-35px_rgba(131,110,249,0.9)] hover:bg-primary/90'
    : 'bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground';

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cn(base, styles)}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

interface PortfolioStatProps {
  readonly label: string;
  readonly value: string;
  readonly tone?: 'primary' | 'accent';
}

function PortfolioStat({ label, value, tone }: PortfolioStatProps) {
  const toneClass = tone === 'primary' ? 'text-primary' : tone === 'accent' ? 'text-accent' : 'text-foreground';

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-3 text-xl font-semibold', toneClass)}>{value}</p>
    </div>
  );
}
