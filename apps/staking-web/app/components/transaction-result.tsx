'use client';

import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import { ExplorerLink } from './explorer-link';
import type { TransactionStage, TransactionContext } from '@/lib/stake-utils';
import { useEffect } from 'react';
import {
  ChainBreakPixelIcon,
  ChestPixelIcon,
} from '@/app/components/icons';
import { usePixelSound } from '@/hooks/usePixelSound';

interface TransactionResultProps {
  txHash: string | null;
  txError: string | null;
  networkConfig: ResolvedMonadNetworkConfig;
  open: boolean;
  onClose: () => void;
  stage: TransactionStage;
  txCount: number;
  txContext?: TransactionContext | null;
  validatorName?: string;
}

export function TransactionResult({ txHash, txError, networkConfig, open, onClose, stage, txCount, txContext, validatorName }: TransactionResultProps) {
  const playSound = usePixelSound();

  const shouldRender = open && stage !== 'idle' && stage !== 'pending';
  const isError = stage === 'error';
  const isConfirmed = stage === 'confirmed';

  useEffect(() => {
    if (!shouldRender) return;
    if (isError) {
      playSound('chain');
    } else if (isConfirmed) {
      playSound('chest');
    } else {
      playSound('coin');
    }
  }, [shouldRender, isError, isConfirmed, playSound]);

  if (!shouldRender) return null;

  const actionLabel = txContext?.action ? txContext.action.charAt(0).toUpperCase() + txContext.action.slice(1) : 'Transaction';
  const title = isError ? `${actionLabel} failed` : isConfirmed ? `${actionLabel} confirmed` : `${actionLabel} submitted`;
  const description = isError
    ? txError ?? 'The network returned an error while processing your transaction.'
    : isConfirmed
    ? 'Your transaction has been confirmed on-chain.'
    : "We will update the details once the transaction is confirmed on-chain.";

  const displayValidatorName = validatorName ?? (txContext?.validatorId ? `Validator ${txContext.validatorId}` : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur overflow-y-auto">
      <div className="relative my-8 w-full max-w-md border-2 border-border bg-secondary/50 p-6 text-foreground shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center border-2 border-border bg-secondary/60 text-muted-foreground transition-all duration-150 hover:border-primary hover:text-primary active:translate-x-[1px] active:translate-y-[1px]"
          aria-label="Close"
        >
          <ChainBreakPixelIcon size={16} className="text-primary" />
        </button>

        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className={isError ? 'flex-shrink-0 border-2 border-red-400 bg-red-400/20 p-2' : 'flex-shrink-0 border-2 border-primary bg-primary/15 p-2'}>
              {isError ? <ChainBreakPixelIcon size={18} className="text-red-300" /> : <ChestPixelIcon size={18} className="animate-chest-sparkle text-primary" />}
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <h3 className="font-display text-lg uppercase tracking-[0.14em] text-primary break-words">{title}</h3>
              <p className={isError ? 'text-sm text-red-200 break-words whitespace-pre-wrap' : 'text-sm text-muted-foreground break-words'}>{description}</p>
              {txCount > 1 ? (
                <p className="text-xs text-muted-foreground/80 break-words">
                  {isError ? `${txCount} transactions were attempted; at least one failed.` : `${txCount} transactions were submitted for this action.`}
                </p>
              ) : null}
            </div>
          </div>

          {txContext && (displayValidatorName || txContext.amount || txContext.withdrawalId !== undefined) ? (
            <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
              <p className="font-medium text-foreground">Transaction details</p>
              <div className="space-y-1.5">
                {displayValidatorName ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Validator</span>
                    <span className="font-medium text-foreground">{displayValidatorName}</span>
                  </div>
                ) : null}
                {txContext.amount ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium text-foreground">{txContext.amount}</span>
                  </div>
                ) : null}
                {txContext.withdrawalId !== undefined ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Withdrawal ID</span>
                    <span className="font-medium text-foreground">#{txContext.withdrawalId}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {txHash ? (
            <div className={isError ? 'border-2 border-red-400 bg-red-400/10 p-4 text-sm' : 'border-2 border-primary bg-primary/15 p-4 text-sm'}>
              <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-primary">Transaction hash</p>
              <div className="break-all">
                <ExplorerLink
                  config={networkConfig}
                  type="tx"
                  value={txHash}
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                >
                  <span className="break-all font-mono text-xs">{txHash}</span>
                </ExplorerLink>
              </div>
            </div>
          ) : null}

          <ButtonRow onClose={onClose} isError={isError} />
        </div>
      </div>
    </div>
  );
}

function ButtonRow({ onClose, isError }: { onClose: () => void; isError: boolean }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={
        isError
          ? 'w-full border-2 border-red-400 bg-red-400/15 px-4 py-2 font-display text-xs uppercase tracking-[0.14em] text-red-200 transition hover:bg-red-400/25'
          : 'w-full border-2 border-primary bg-primary px-4 py-2 font-display text-xs uppercase tracking-[0.14em] text-primary-foreground transition hover:bg-primary/90'
      }
    >
      {isError ? 'Dismiss' : 'Close'}
    </button>
  );
}
