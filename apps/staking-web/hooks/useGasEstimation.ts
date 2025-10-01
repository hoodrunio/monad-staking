import { useCallback, useState } from 'react';
import type { MonadStakingSdk } from '@monad-staking/sdk';
import type { Transport } from 'viem';
import { formatEther, parseEther } from 'viem';

interface UseGasEstimationProps {
  sdk: MonadStakingSdk<Transport> | null;
  account: `0x${string}` | undefined;
}

export function useGasEstimation({ sdk, account }: UseGasEstimationProps) {
  const [estimating, setEstimating] = useState(false);

  const calculateMaxStakeable = useCallback(
    async (validatorId: string, balance: bigint): Promise<bigint> => {
      if (!sdk || !account) return 0n;

      try {
        setEstimating(true);
        const maxStakeable = await sdk.calculateMaxStakeableAmount({
          validatorId: BigInt(validatorId),
          balance,
          account,
        });
        return maxStakeable;
      } catch (error) {
        console.error('Failed to calculate max stakeable:', error);
        // Fallback: reserve 0.01 MON for gas
        const reserved = balance - parseEther('0.01');
        return reserved > 0n ? reserved : 0n;
      } finally {
        setEstimating(false);
      }
    },
    [sdk, account],
  );

  const estimateDelegateGas = useCallback(
    async (validatorId: string, amount: bigint) => {
      if (!sdk || !account) return null;

      try {
        setEstimating(true);
        const estimate = await sdk.estimateDelegateGas({
          validatorId: BigInt(validatorId),
          amount,
          account,
        });
        return {
          gas: estimate.gas,
          gasPrice: estimate.gasPrice,
          totalCost: estimate.totalCost,
          totalCostFormatted: formatEther(estimate.totalCost),
        };
      } catch (error) {
        console.error('Failed to estimate gas:', error);
        return null;
      } finally {
        setEstimating(false);
      }
    },
    [sdk, account],
  );

  const estimateUndelegateGas = useCallback(
    async (validatorId: string, amount: bigint, withdrawalId: number) => {
      if (!sdk || !account) return null;

      try {
        setEstimating(true);
        const estimate = await sdk.estimateUndelegateGas({
          validatorId: BigInt(validatorId),
          amount,
          withdrawalId,
          account,
        });
        return {
          gas: estimate.gas,
          gasPrice: estimate.gasPrice,
          totalCost: estimate.totalCost,
          totalCostFormatted: formatEther(estimate.totalCost),
        };
      } catch (error) {
        console.error('Failed to estimate gas:', error);
        return null;
      } finally {
        setEstimating(false);
      }
    },
    [sdk, account],
  );

  return {
    estimating,
    calculateMaxStakeable,
    estimateDelegateGas,
    estimateUndelegateGas,
  };
}
