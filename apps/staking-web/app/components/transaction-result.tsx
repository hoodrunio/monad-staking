'use client';

import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ExplorerLink } from './explorer-link';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import type { TransactionStage } from '@/lib/stake-utils';

interface TransactionResultProps {
  txHash: string | null;
  txError: string | null;
  networkConfig: ResolvedMonadNetworkConfig;
  open: boolean;
  onClose: () => void;
  stage: TransactionStage;
}

export function TransactionResult({ txHash, txError, networkConfig, open, onClose, stage }: TransactionResultProps) {
  if (!open) return null;
  if (stage === 'idle' || stage === 'pending') return null;

  const isError = stage === 'error';
  const isConfirmed = stage === 'confirmed';

  const title = isError
    ? 'Transaction failed'
    : isConfirmed
    ? 'Transaction confirmed'
    : 'Transaction submitted';

  const description = isError
    ? txError ?? 'The network returned an error while processing your transaction.'
    : isConfirmed
    ? 'Your transaction has been confirmed on-chain.'
    : "We'll update the details once the transaction is confirmed on-chain.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-emerald-500/10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 transition hover:text-slate-300"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className={`space-y-4 ${isError ? 'text-red-200' : 'text-emerald-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${isError ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
              {isError ? (
                <ExclamationCircleIcon className="h-6 w-6 text-red-400" />
              ) : (
                <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className={`text-sm ${isError ? 'text-red-300' : 'text-emerald-300'}`}>{description}</p>
            </div>
          </div>

          {!isError && txHash && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
              <p className="text-emerald-100">Track progress in the explorer:</p>
              <ExplorerLink
                config={networkConfig}
                type="tx"
                value={txHash}
                className="mt-1 inline-flex items-center gap-2 text-emerald-200 hover:text-emerald-100"
              >
                {txHash}
              </ExplorerLink>
            </div>
          )}

          {isError && txHash && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
              <p className="font-medium">Failed transaction hash</p>
              <ExplorerLink
                config={networkConfig}
                type="tx"
                value={txHash}
                className="mt-1 inline-flex items-center gap-2 text-red-200 hover:text-red-100"
              >
                {txHash}
              </ExplorerLink>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`w-full rounded-md px-4 py-2 text-sm font-semibold text-white transition ${
              isError ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isError ? 'Dismiss' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
