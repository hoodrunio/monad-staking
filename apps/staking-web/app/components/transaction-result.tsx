'use client';

import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ExplorerLink } from './explorer-link';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';

interface TransactionResultProps {
  txHash: string | null;
  txError: string | null;
  networkConfig: ResolvedMonadNetworkConfig;
  open: boolean;
  onClose: () => void;
}

export function TransactionResult({ txHash, txError, networkConfig, open, onClose }: TransactionResultProps) {
  if (!open || (!txHash && !txError)) return null;

  const isError = Boolean(txError);

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

        {isError ? (
          <div className="space-y-4 text-red-200">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-500/10 p-2">
                <ExclamationCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Transaction failed</h3>
                <p className="text-sm text-red-300">{txError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-emerald-200">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Transaction submitted</h3>
                <p className="text-sm text-emerald-300">
                  We&apos;ll update the details once the transaction is confirmed on-chain.
                </p>
              </div>
            </div>
            {txHash && (
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
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
