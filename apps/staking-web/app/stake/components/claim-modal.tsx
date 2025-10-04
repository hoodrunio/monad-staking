'use client';

import type { ReactNode } from 'react';
import { ActionModal } from './action-modal';
import { Button } from '@/app/components/ui/button';
import { ChestPixelIcon, SparklePixelIcon } from '@/app/components/icons';
import { cn } from '@/lib/utils';

export interface ClaimValidatorOption {
  readonly validatorId: string;
  readonly title: string;
  readonly rewardsFormatted: string;
  readonly stakeFormatted: string;
}

type ClaimMode = 'all' | 'custom';

interface ClaimModalProps {
  readonly open: boolean;
  readonly options: readonly ClaimValidatorOption[];
  readonly selectedValidatorIds: readonly string[];
  readonly mode: ClaimMode;
  readonly onModeChange: (mode: ClaimMode) => void;
  readonly onToggleValidator: (validatorId: string) => void;
  readonly totalRewards: string;
  readonly selectedRewards: string;
  readonly validatorCount: number;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly busy?: boolean;
}

export function ClaimModal({
  open,
  options,
  selectedValidatorIds,
  mode,
  onModeChange,
  onToggleValidator,
  totalRewards,
  selectedRewards,
  validatorCount,
  onClose,
  onConfirm,
  busy = false,
}: ClaimModalProps) {
  const hasOptions = options.length > 0;
  const hasSelection = mode === 'all' ? hasOptions : selectedValidatorIds.length > 0;
  const canConfirm = hasSelection && !busy;

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Claim Rewards"
      description="Choose how you would like to collect unclaimed rewards from your delegations."
      footer={
        <div className="flex w-full justify-between gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!canConfirm} className="bg-primary text-background hover:bg-primary/90">
            {busy ? 'Claiming...' : mode === 'all' ? 'Claim all rewards' : 'Claim selected'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border-2 border-border bg-secondary/40 p-4 text-sm leading-relaxed tracking-[0.08em] text-muted-foreground">
          <div className="mb-2 inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.14em] text-primary">
            <ChestPixelIcon size={14} className="text-primary" />
            Rewards summary
          </div>
          <p>
            We detected rewards across {validatorCount} delegation{validatorCount === 1 ? '' : 's'}. Claim all in one go, or switch to manual selection to pick specific validators.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ModeButton
            label="Claim all"
            active={mode === 'all'}
            onClick={() => onModeChange('all')}
            disabled={busy}
            icon={<SparklePixelIcon size={14} className="text-primary" />}
          />
          <ModeButton
            label="Select validators"
            active={mode === 'custom'}
            onClick={() => onModeChange('custom')}
            disabled={!hasOptions || busy}
            icon={<ChestPixelIcon size={14} className="text-primary" />}
          />
        </div>

        <div className="rounded-2xl border-2 border-border bg-secondary/40 p-4 text-xs tracking-[0.1em] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="font-display uppercase text-primary">Estimated payout</span>
            <ChestPixelIcon size={14} className="text-primary" />
          </div>
          <div className="mt-3 font-mono text-lg text-foreground">
            {mode === 'all' ? totalRewards : selectedRewards}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed">
            Rewards will be sent to your connected wallet when the claim completes.
          </p>
        </div>

        {mode === 'custom' ? (
          hasOptions ? (
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {options.map((option) => {
                const selected = selectedValidatorIds.includes(option.validatorId);
                return (
                  <button
                    key={option.validatorId}
                    type="button"
                    onClick={() => onToggleValidator(option.validatorId)}
                    disabled={busy}
                    className={cn(
                      'flex w-full items-center justify-between gap-4 rounded-2xl border-2 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0',
                      selected
                        ? 'border-primary bg-secondary/50 text-foreground'
                        : 'border-border bg-secondary/30 text-foreground hover:border-primary/70 hover:bg-secondary/40',
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-display text-sm uppercase tracking-[0.12em] text-primary">{option.title}</span>
                      <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Stake {option.stakeFormatted}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-sm text-primary">
                      <ChestPixelIcon size={12} className="text-primary" />
                      {option.rewardsFormatted}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-border bg-secondary/30 p-4 text-center text-sm text-muted-foreground">
              No validators currently have rewards available to claim.
            </div>
          )
        ) : null}
      </div>
    </ActionModal>
  );
}

function ModeButton({
  label,
  active,
  onClick,
  disabled,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'border-primary bg-primary/20 text-primary'
          : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/60 hover:text-primary',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
