'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { formatEffectiveEpoch, formatWithdrawableEpoch } from '@/lib/utils';

interface EffectiveEpochsInfoProps {
  currentEpoch: bigint;
  inEpochDelayPeriod: boolean;
  withdrawalDelay: number;
  actionType: 'delegate' | 'undelegate';
}

export function EffectiveEpochsInfo({ 
  currentEpoch, 
  inEpochDelayPeriod, 
  withdrawalDelay, 
  actionType 
}: EffectiveEpochsInfoProps) {
  const effectiveMessage = formatEffectiveEpoch(
    currentEpoch, 
    inEpochDelayPeriod, 
    actionType
  );

  const withdrawableMessage = actionType === 'undelegate' 
    ? formatWithdrawableEpoch(currentEpoch, inEpochDelayPeriod, withdrawalDelay)
    : null;

  return (
    <div className="rounded-lg border border-blue-900/40 bg-blue-950/30 p-3">
      <div className="flex items-start gap-2">
        <InformationCircleIcon className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-xs text-blue-200">
          <p>{effectiveMessage}</p>
          {withdrawableMessage && (
            <p className="text-blue-300">{withdrawableMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
