'use client';

import { ActionModal } from './action-modal';
import { Button } from '@/app/components/ui/button';
import { ChestPixelIcon } from '@/app/components/icons';

interface ClaimModalProps {
  readonly open: boolean;
  readonly totalRewards: string;
  readonly validatorCount: number;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly busy?: boolean;
}

export function ClaimModal({
  open,
  totalRewards,
  validatorCount,
  onClose,
  onConfirm,
  busy = false,
}: ClaimModalProps) {
  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Claim Rewards"
      description="Collect all unclaimed rewards from your active delegations."
      footer={
        <div className="flex w-full justify-between gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy} className="bg-primary text-background hover:bg-primary/90">
            {busy ? 'Claiming...' : 'Confirm claim'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-border bg-secondary/40 p-4 text-sm leading-relaxed tracking-[0.08em] text-muted-foreground">
          <div className="mb-2 inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.14em] text-primary">
            <ChestPixelIcon size={14} className="text-primary" />
            Rewards summary
          </div>
          <p>
            We will submit a few transactions that claims rewards from {validatorCount} delegation{validatorCount === 1 ? '' : 's'}. Your wallet will prompt for confirmations next.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-secondary/40 p-4 text-xs tracking-[0.1em] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="font-display uppercase text-primary">Ready to collect</span>
            <ChestPixelIcon size={14} className="text-primary" />
          </div>
          <div className="mt-3 font-mono text-lg text-foreground">
            {totalRewards}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed">
            Rewards will be sent to your connected wallet as part of this claim.
          </p>
        </div>
      </div>
    </ActionModal>
  );
}
