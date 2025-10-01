import { describe, expect, it, vi } from 'vitest';
import type { PublicClient, Transport, WalletClient } from 'viem';
import { encodeFunctionData, encodeFunctionResult } from 'viem';
import { MONAD_STAKING_PRECOMPILE_ADDRESS } from '@monad-staking/config';
import {
  MonadStakingSdk,
  createMonadStakingSdk,
  loadMonadNetworks,
  resolveMonadNetwork,
  stakingAbi,
} from './index.js';

const network = {
  key: 'monad-testnet-1',
  label: 'Monad Testnet-1',
  chainId: 17000,
  rpcUrl: 'https://rpc.monad.testnet-1.example',
  explorerBaseUrl: 'https://explorer.monad.testnet-1.example',
  epochLength: 50_000,
  epochDelayPeriod: 5_000,
  withdrawalDelay: 1,
  precompileAddress: MONAD_STAKING_PRECOMPILE_ADDRESS,
  enabled: true,
} as const;

type TestTransport = Transport;

describe('MonadStakingSdk', () => {
  it('reads epoch information via the public client', async () => {
    const call = vi.fn().mockImplementation(({ data }: { data: `0x${string}` }) => {
      // ensure request data matches encoded call
      const expected = encodeFunctionData({
        abi: stakingAbi,
        functionName: 'getEpoch',
        args: [],
      });
      expect(data).toBe(expected);
      return Promise.resolve({
        data: encodeFunctionResult({
          abi: stakingAbi,
          functionName: 'getEpoch',
          result: [12n, false],
        }),
      });
    });

    const publicClient = {
      chain: { id: network.chainId },
      call,
    } as unknown as PublicClient<TestTransport>;

    const sdk = new MonadStakingSdk({
      network,
      publicClient,
    });

    const info = await sdk.getEpoch();

    expect(call).toHaveBeenCalledOnce();
    expect(info).toEqual({ epoch: 12n, inEpochDelayPeriod: false });
  });

  it('throws when attempting to delegate without a wallet client', async () => {
    const readContract = vi.fn();
    const call = vi.fn();
    const publicClient = {
      chain: { id: network.chainId },
      readContract,
      call,
    } as unknown as PublicClient<TestTransport>;

    const sdk = new MonadStakingSdk({
      network,
      publicClient,
    });

    await expect(
      sdk.delegate({
        validatorId: 1n,
        amount: 1_000_000_000_000_000_000n,
        account: '0x0000000000000000000000000000000000000001',
      }),
    ).rejects.toThrow('Wallet client is not configured');
  });

  it('writes delegation transactions through the configured wallet', async () => {
    const writeContract = vi.fn().mockResolvedValue('0xhash' as const);
    const walletClient = {
      chain: { id: network.chainId },
      writeContract,
    } as unknown as WalletClient<TestTransport>;

    const publicClient = {
      chain: { id: network.chainId },
      readContract: vi.fn(),
      call: vi.fn(),
    } as unknown as PublicClient<TestTransport>;

    const sdk = createMonadStakingSdk({
      network,
      publicClient,
      walletClient,
    });

    const hash = await sdk.delegate({
      validatorId: 3n,
      amount: 5_000_000_000_000_000_000n,
      account: '0x0000000000000000000000000000000000000002',
    });

    expect(hash).toBe('0xhash');
    expect(writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: network.precompileAddress,
        abi: expect.any(Array),
        functionName: 'delegate',
        args: [3n],
        value: 5_000_000_000_000_000_000n,
        account: '0x0000000000000000000000000000000000000002',
      }),
    );
  });
});

describe('configuration helpers', () => {
  it('loads config with enabled flag based on env', () => {
    const configs = loadMonadNetworks({
      MONAD_MAINNET_CHAIN_ID: '17001',
      MONAD_MAINNET_RPC_URL: 'https://rpc.mainnet.example',
      MONAD_TESTNET_1_CHAIN_ID: '17000',
      MONAD_TESTNET_1_RPC_URL: 'https://rpc.testnet1.example',
      MONAD_TESTNET_2_CHAIN_ID: '17002',
      MONAD_TESTNET_2_RPC_URL: 'https://rpc.testnet2.example',
    });

    expect(configs['monad-mainnet'].enabled).toBe(true);
    expect(configs['monad-testnet-1'].enabled).toBe(true);
    expect(configs['monad-testnet-2'].enabled).toBe(true);
  });

  it('throws when resolving an unconfigured network', () => {
    const configs = loadMonadNetworks({
      MONAD_TESTNET_1_CHAIN_ID: '17000',
      MONAD_TESTNET_1_RPC_URL: 'https://rpc.testnet1.example',
    });

    expect(() => resolveMonadNetwork(configs, 'monad-mainnet')).toThrow(
      /not fully configured/i,
    );
  });
});

describe('validation', () => {
  const publicClient = {
    chain: { id: network.chainId },
    call: vi.fn(),
    readContract: vi.fn(),
  } as unknown as PublicClient<TestTransport>;

  const walletClient = {
    chain: { id: network.chainId },
    writeContract: vi.fn().mockResolvedValue('0xhash'),
  } as unknown as WalletClient<TestTransport>;

  it('throws on withdrawal ID 0', async () => {
    const sdk = new MonadStakingSdk({ network, publicClient, walletClient });

    await expect(
      sdk.undelegate({
        validatorId: 1n,
        amount: 1_000_000_000_000_000_000n,
        withdrawalId: 0,
        account: '0x0000000000000000000000000000000000000001',
      }),
    ).rejects.toThrow('withdrawalId must be between 1 and 255');
  });

  it('throws on withdrawal ID 256', async () => {
    const sdk = new MonadStakingSdk({ network, publicClient, walletClient });

    await expect(
      sdk.undelegate({
        validatorId: 1n,
        amount: 1_000_000_000_000_000_000n,
        withdrawalId: 256,
        account: '0x0000000000000000000000000000000000000001',
      }),
    ).rejects.toThrow('withdrawalId must be between 1 and 255');
  });

  it('allows withdrawal ID 1', async () => {
    const sdk = new MonadStakingSdk({ network, publicClient, walletClient });

    await sdk.undelegate({
      validatorId: 1n,
      amount: 1_000_000_000_000_000_000n,
      withdrawalId: 1,
      account: '0x0000000000000000000000000000000000000001',
    });

    expect(walletClient.writeContract).toHaveBeenCalled();
  });

  it('allows withdrawal ID 255', async () => {
    const sdk = new MonadStakingSdk({ network, publicClient, walletClient });

    await sdk.undelegate({
      validatorId: 1n,
      amount: 1_000_000_000_000_000_000n,
      withdrawalId: 255,
      account: '0x0000000000000000000000000000000000000001',
    });

    expect(walletClient.writeContract).toHaveBeenCalled();
  });

  it('throws on negative commission', async () => {
    const sdk = new MonadStakingSdk({ network, publicClient, walletClient });

    await expect(
      sdk.changeCommission({
        validatorId: 1n,
        newCommission: -1n,
        account: '0x0000000000000000000000000000000000000001',
      }),
    ).rejects.toThrow('commission must be expressed in 1e18 units');
  });

  it('throws on commission > 1e18', async () => {
    const sdk = new MonadStakingSdk({ network, publicClient, walletClient });

    await expect(
      sdk.changeCommission({
        validatorId: 1n,
        newCommission: 1_000_000_000_000_000_001n,
        account: '0x0000000000000000000000000000000000000001',
      }),
    ).rejects.toThrow('commission must be expressed in 1e18 units');
  });

  it('allows commission 0', async () => {
    const sdk = new MonadStakingSdk({ network, publicClient, walletClient });

    await sdk.changeCommission({
      validatorId: 1n,
      newCommission: 0n,
      account: '0x0000000000000000000000000000000000000001',
    });

    expect(walletClient.writeContract).toHaveBeenCalled();
  });

  it('allows commission 1e18 (100%)', async () => {
    const sdk = new MonadStakingSdk({ network, publicClient, walletClient });

    await sdk.changeCommission({
      validatorId: 1n,
      newCommission: 1_000_000_000_000_000_000n,
      account: '0x0000000000000000000000000000000000000001',
    });

    expect(walletClient.writeContract).toHaveBeenCalled();
  });

  it('throws on delegate with zero amount', async () => {
    const sdk = new MonadStakingSdk({ network, publicClient, walletClient });

    await expect(
      sdk.delegate({
        validatorId: 1n,
        amount: 0n,
        account: '0x0000000000000000000000000000000000000001',
      }),
    ).rejects.toThrow('must be greater than zero');
  });

  it('throws on undelegate with zero amount', async () => {
    const sdk = new MonadStakingSdk({ network, publicClient, walletClient });

    await expect(
      sdk.undelegate({
        validatorId: 1n,
        amount: 0n,
        withdrawalId: 1,
        account: '0x0000000000000000000000000000000000000001',
      }),
    ).rejects.toThrow('must be greater than zero');
  });
});

describe('helper utilities', () => {
  const publicClient = {
    chain: { id: network.chainId },
    call: vi.fn(),
  } as unknown as PublicClient<TestTransport>;

  it('calculates activation epoch before boundary block', async () => {
    publicClient.call = vi.fn().mockResolvedValue({
      data: encodeFunctionResult({
        abi: stakingAbi,
        functionName: 'getEpoch',
        result: [5n, false],
      }),
    });

    const sdk = new MonadStakingSdk({ network, publicClient });
    const info = await sdk.calculateActivationEpoch();

    expect(info.activationEpoch).toBe(6n);
    expect(info.currentEpoch).toBe(5n);
    expect(info.inEpochDelayPeriod).toBe(false);
    expect(info.reason).toContain('n+1');
  });

  it('calculates activation epoch during delay period', async () => {
    publicClient.call = vi.fn().mockResolvedValue({
      data: encodeFunctionResult({
        abi: stakingAbi,
        functionName: 'getEpoch',
        result: [5n, true],
      }),
    });

    const sdk = new MonadStakingSdk({ network, publicClient });
    const info = await sdk.calculateActivationEpoch();

    expect(info.activationEpoch).toBe(7n);
    expect(info.currentEpoch).toBe(5n);
    expect(info.inEpochDelayPeriod).toBe(true);
    expect(info.reason).toContain('n+2');
  });

  it('calculates withdraw epoch before boundary block', async () => {
    publicClient.call = vi.fn().mockResolvedValue({
      data: encodeFunctionResult({
        abi: stakingAbi,
        functionName: 'getEpoch',
        result: [5n, false],
      }),
    });

    const sdk = new MonadStakingSdk({ network, publicClient });
    const info = await sdk.calculateWithdrawEpoch();

    expect(info.withdrawEpoch).toBe(7n);
    expect(info.currentEpoch).toBe(5n);
    expect(info.withdrawalDelay).toBe(1);
    expect(info.reason).toContain('n+2');
  });

  it('calculates withdraw epoch during delay period', async () => {
    publicClient.call = vi.fn().mockResolvedValue({
      data: encodeFunctionResult({
        abi: stakingAbi,
        functionName: 'getEpoch',
        result: [5n, true],
      }),
    });

    const sdk = new MonadStakingSdk({ network, publicClient });
    const info = await sdk.calculateWithdrawEpoch();

    expect(info.withdrawEpoch).toBe(8n);
    expect(info.currentEpoch).toBe(5n);
    expect(info.withdrawalDelay).toBe(1);
    expect(info.reason).toContain('n+3');
  });
});
