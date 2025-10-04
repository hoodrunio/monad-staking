'use client';

import { ActionModal } from './action-modal';
import { ValidatorSelector } from '@/app/components/validator-selector';
import { Button } from '@/app/components/ui/button';
import { SparklePixelIcon, CoinPixelIcon } from '@/app/components/icons';

export interface CompoundValidatorOption {
  readonly validatorId: string;
  readonly title: string;
  readonly rewards: string;
  readonly stake: string;
  readonly badge?: string;
}

interface CompoundModalProps {
  readonly open: boolean;
  readonly options: readonly CompoundValidatorOption[];
  readonly selectedValidatorId: string | null;
  readonly onSelectValidator: (validatorId: string) => void;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly busy?: boolean;
}

export function CompoundModal({
  open,
  options,
  selectedValidatorId,
  onSelectValidator,
  onClose,
  onConfirm,
  busy = false,
}: CompoundModalProps) {
  const selection = options.find((item) => item.validatorId === selectedValidatorId) ?? null;
  const hasOptions = options.length > 0;
  const canConfirm = Boolean(selection) && !busy;

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Compound Rewards"
      description="Re-delegate your unclaimed rewards back into a validator to grow your stake."
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={busy} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="w-full bg-primary text-background hover:bg-primary/90 sm:w-auto"
          >
            {busy ? 'Compounding...' : 'Confirm compound'}
          </Button>
        </div>
      }
    >
      {hasOptions ? (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-border bg-secondary/40 p-4 text-sm leading-relaxed tracking-[0.08em] text-muted-foreground">
            <div className="mb-2 inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.14em] text-primary">
              <SparklePixelIcon size={14} className="text-primary" />
              Rewards available
            </div>
            <p>
              Select a validator with pending rewards. Compounding sends your rewards back into the active stake for that validator in a single transaction.
            </p>
          </div>

          <ValidatorSelector
            value={selectedValidatorId ?? ''}
            onChange={onSelectValidator}
            options={options.map((item) => ({
              value: item.validatorId,
              title: item.title,
              subtitle: `${item.rewards} rewards • ${item.stake} staked`,
              badge: item.badge,
            }))}
            emptyMessage="No validators have rewards to compound"
          />

          {selection ? (
            <div className="rounded-2xl border-2 border-border bg-secondary/40 p-4 text-xs tracking-[0.1em] text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="font-display uppercase text-primary">Review</span>
                <CoinPixelIcon size={14} className="text-primary" />
              </div>
              <div className="mt-3 space-y-2 font-mono text-sm text-foreground">
                <div className="flex items-center justify-between">
                  <span>Validator</span>
                  <span>{selection.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Re-staking</span>
                  <span>{selection.rewards}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>New stake (est.)</span>
                  <span>{selection.stake} + rewards</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-border bg-secondary/40 p-4 text-sm tracking-[0.08em] text-muted-foreground">
          No validators currently have rewards available to compound.
        </div>
      )}
    </ActionModal>
  );
}
