'use client';

import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import { ExplorerLink } from './explorer-link';
import type { TransactionStage, TransactionContext } from '@/lib/stake-utils';

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
  if (!open) return null;
  if (stage === 'idle' || stage === 'pending') return null;

  const isError = stage === 'error';
  const isConfirmed = stage === 'confirmed';

  const actionLabel = txContext?.action ? txContext.action.charAt(0).toUpperCase() + txContext.action.slice(1) : 'Transaction';
  const title = isError ? `${actionLabel} failed` : isConfirmed ? `${actionLabel} confirmed` : `${actionLabel} submitted`;
  const description = isError
    ? txError ?? 'The network returned an error while processing your transaction.'
    : isConfirmed
    ? 'Your transaction has been confirmed on-chain.'
    : "We will update the details once the transaction is confirmed on-chain.";

  const displayValidatorName = validatorName ?? (txContext?.validatorId ? `Validator ${txContext.validatorId}` : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <div className="relative w-full max-w-md rounded-3xl bg-background/90 p-6 text-foreground shadow-[0_45px_80px_-45px_rgba(56,189,248,0.55)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:text-primary"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className={isError ? 'rounded-full bg-red-400/15 p-2' : 'rounded-full bg-primary/15 p-2'}>
              {isError ? <ExclamationTriangleIcon className="h-6 w-6 text-red-300" /> : <CheckCircleIcon className="h-6 w-6 text-primary" />}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className={isError ? 'text-sm text-red-200' : 'text-sm text-muted-foreground'}>{description}</p>
              {txCount > 1 ? (
                <p className="text-xs text-muted-foreground/80">
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
            <div className={isError ? 'rounded-2xl bg-red-400/10 p-4 text-sm' : 'rounded-2xl bg-primary/15 p-4 text-sm'}>
              <p className="mb-2 font-medium">Transaction hash</p>
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

          <button
            type="button"
            onClick={onClose}
            className={isError ? 'w-full rounded-xl bg-red-400/20 px-4 py-2 text-sm font-semibold text-red-50 transition hover:text-white' : 'w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90'}
          >
            {isError ? 'Dismiss' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
