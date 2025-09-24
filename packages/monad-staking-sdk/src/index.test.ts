import { describe, expect, it, vi } from 'vitest';
import type { PublicClient, Transport, WalletClient } from 'viem';
import { MONAD_STAKING_PRECOMPILE_ADDRESS } from '@monad-staking/config';
import {
  MonadStakingSdk,
  createMonadStakingSdk,
  loadMonadNetworks,
  resolveMonadNetwork,
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
    const readContract = vi
      .fn()
      .mockResolvedValue<[bigint, boolean]>([12n, false]);

    const publicClient = {
      chain: { id: network.chainId },
      readContract,
    } as unknown as PublicClient<TestTransport>;

    const sdk = new MonadStakingSdk({
      network,
      publicClient,
    });

    const info = await sdk.getEpoch();

    expect(readContract).toHaveBeenCalledWith({
      address: network.precompileAddress,
      abi: expect.any(Array),
      functionName: 'getEpoch',
    });
    expect(info).toEqual({ epoch: 12n, inEpochDelayPeriod: false });
  });

  it('throws when attempting to delegate without a wallet client', async () => {
    const readContract = vi.fn();
    const publicClient = {
      chain: { id: network.chainId },
      readContract,
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
