'use client';

import { useState, useEffect } from 'react';
import { ActionModal } from './action-modal';
import { ValidatorSelector } from '@/app/components/validator-selector';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { formatEther, parseEther } from 'viem';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon, Loading01Icon } from '@hugeicons/core-free-icons';

export type ValidatorOption = {
  value: string;
  title: string;
  subtitle: string;
  stats?: Array<{ label: string; value: string }>;
  badge?: string;
};

interface StakingModalProps {
  readonly open: boolean;
  readonly mode: 'stake' | 'unstake';
  readonly validatorOptions: ValidatorOption[];
  readonly selectedValidatorId: string | null;
  readonly onValidatorChange: (validatorId: string) => void;
  readonly amount: string;
  readonly onAmountChange: (amount: string) => void;
  readonly maxAmount: bigint | null;
  readonly gasEstimate: string | null;
  readonly isEstimating: boolean;
  readonly onCalculateMax: () => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly hasMore?: boolean;
  readonly onLoadMore?: () => void;
  readonly loadingMore?: boolean;
  readonly toolbar?: React.ReactNode;
  readonly availableBalance?: string;
  readonly additionalInfo?: React.ReactNode;
}

function sanitizeAmount(value: string): string {
  return value.replace(/[^0-9.]/g, '');
}

export function StakingModal({
  open,
  mode,
  validatorOptions,
  selectedValidatorId,
  onValidatorChange,
  amount,
  onAmountChange,
  maxAmount,
  gasEstimate,
  isEstimating,
  onCalculateMax,
  onSubmit,
  onClose,
  disabled = false,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  toolbar,
  availableBalance,
  additionalInfo,
}: StakingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Reset to step 1 when modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
    }
  }, [open]);

  const isStake = mode === 'stake';
  const title = isStake ? 'Delegate Stake' : 'Start Undelegation';
  const submitLabel = isStake ? 'Delegate' : 'Undelegate';
  const amountLabel = isStake ? 'Amount to stake' : 'Amount to unstake';

  const canSubmit = 
    selectedValidatorId && 
    amount && 
    Number(sanitizeAmount(amount)) > 0 &&
    !disabled &&
    !isEstimating &&
    (maxAmount === null || parseEther(sanitizeAmount(amount) || '0') <= maxAmount);

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title={step === 1 ? `${title} - Step 1: Select Validator` : `${title} - Step 2: Enter Amount`}
      description={step === 1 ? 'Choose a validator to delegate to' : 'Enter the amount you want to stake'}
    >
      <div className="space-y-4">
        {/* Step 1: Validator Selection */}
        {step === 1 && (
          <>
            <ValidatorSelector
              value={selectedValidatorId ?? ''}
              onChange={onValidatorChange}
              options={validatorOptions}
              loading={loading}
              emptyMessage="No validators available"
              hasMore={hasMore}
              onLoadMore={onLoadMore}
              loadingMore={loadingMore}
              disabled={disabled}
              toolbar={toolbar}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedValidatorId) {
                    setStep(2);
                    onCalculateMax();
                  }
                }}
                disabled={!selectedValidatorId || disabled}
              >
                Next
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Amount Input */}
        {step === 2 && (
          <>
            {/* Show selected validator */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground mb-1">Selected Validator</div>
              <div className="font-medium">
                {validatorOptions.find(v => v.value === selectedValidatorId)?.title || `Validator ${selectedValidatorId}`}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs"
                onClick={() => setStep(1)}
                disabled={disabled}
              >
                Change Validator
              </Button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount-input" className="text-sm text-muted-foreground">
                  {amountLabel} (MON)
                </Label>
                {maxAmount !== null && !isEstimating && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      if (maxAmount) {
                        onAmountChange(formatEther(maxAmount));
                      }
                    }}
                    disabled={disabled}
                  >
                    Max
                  </Button>
                )}
              </div>
              
              <Input
                id="amount-input"
                type="text"
                value={amount}
                onChange={(e) => {
                  onAmountChange(e.target.value);
                  // Trigger gas estimation on amount change
                  if (e.target.value && Number(sanitizeAmount(e.target.value)) > 0) {
                    onCalculateMax();
                  }
                }}
                placeholder="0.0"
                disabled={disabled}
              />

              {/* Balance & Max Info */}
              <div className="space-y-1">
                {availableBalance && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Available Balance:</span>
                    <span className="font-mono">{availableBalance}</span>
                  </div>
                )}
                
                {maxAmount !== null && !isEstimating && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Max (after gas fees):</span>
                    <span className="font-mono text-amber-400">{formatEther(maxAmount)} MON</span>
                  </div>
                )}

                {gasEstimate && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Estimated gas cost:</span>
                    <span className="font-mono">~{gasEstimate} MON</span>
                  </div>
                )}

                {isEstimating && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                    <HugeiconsIcon icon={Loading01Icon} size={12} className="animate-spin" />
                    <span>Calculating gas cost...</span>
                  </div>
                )}

                {/* Warning if amount exceeds max */}
                {amount && maxAmount !== null && parseEther(sanitizeAmount(amount) || '0') > maxAmount && (
                  <div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-xs text-amber-400">
                    <HugeiconsIcon icon={AlertCircleIcon} size={12} className="flex-shrink-0" />
                    <span>Amount exceeds maximum stakeable (gas fees required)</span>
                  </div>
                )}
              </div>

              {additionalInfo}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={disabled}>
                Back
              </Button>
              <Button 
                onClick={onSubmit}
                disabled={!canSubmit}
                className={isStake ? '' : 'bg-amber-400 text-slate-900 hover:bg-amber-300'}
              >
                {isEstimating ? 'Calculating...' : submitLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    </ActionModal>
  );
}
