'use client';

import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ExplorerLink } from './explorer-link';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';

interface TransactionResultProps {
  txHash: string | null;
  txError: string | null;
  networkConfig: ResolvedMonadNetworkConfig;
}

export function TransactionResult({ txHash, txError, networkConfig }: TransactionResultProps) {
  if (!txHash && !txError) return null;

  if (txError) {
    return (
      <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-4">
        <div className="flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-200">Transaction Failed</h3>
            <p className="mt-1 text-sm text-red-300">{txError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (txHash) {
    return (
      <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-4">
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-emerald-200">Transaction Submitted</h3>
            <div className="mt-1 text-sm text-emerald-300">
              <ExplorerLink config={networkConfig} type="tx" value={txHash}>
                View transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </ExplorerLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
